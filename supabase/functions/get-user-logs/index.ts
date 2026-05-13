import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function signRequest(
  method: string,
  url: string,
  body: string,
  region: string,
  service: string
): Promise<Record<string, string>> {
  const encoder = new TextEncoder();
  const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!;
  const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);

  const parsedUrl = new URL(url);
  const host = parsedUrl.host;
  const canonicalUri = parsedUrl.pathname;

  const canonicalHeaders = `content-type:application/x-amz-json-1.0\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:DynamoDB_20120810.Scan\n`;
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';

  const payloadHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(body)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const requestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${requestHash}`;

  async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key as any, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  const kDate = await hmacSha256(encoder.encode('AWS4' + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');

  const signature = Array.from(
    new Uint8Array(await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(stringToSign)
    ))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Content-Type': 'application/x-amz-json-1.0',
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'DynamoDB_20120810.Scan',
    'Authorization': authorizationHeader,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const tableName = Deno.env.get('AWS_DYNAMODB_TABLE_NAME') || 'MyDataNetwork';
    const dynamoDbUrl = `https://dynamodb.${region}.amazonaws.com/`;

    const scanPayload = JSON.stringify({
      TableName: tableName,
      Limit: 100,
    });

    const headers = await signRequest('POST', dynamoDbUrl, scanPayload, region, 'dynamodb');

    console.log('Fetching logs from DynamoDB...');

    const response = await fetch(dynamoDbUrl, {
      method: 'POST',
      headers,
      body: scanPayload,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('DynamoDB error:', result);
      throw new Error(result.message || 'Failed to fetch from DynamoDB');
    }

    // Parse DynamoDB items to readable format
    const logs = (result.Items || []).map((item: any) => ({
      id: item.pk?.S || '',
      timestamp: item.sk?.S || '',
      action: item.action?.S || '',
      userId: item.user_id?.S || '',
      ipAddress: item.ip_address?.S || '',
      userAgent: item.user_agent?.S || '',
    })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`Successfully fetched ${logs.length} logs`);

    return new Response(JSON.stringify({ logs, count: logs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
