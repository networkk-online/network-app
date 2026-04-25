import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function signRequest(
  method: string,
  url: string,
  body: string,
  region: string,
  service: string,
  target: string
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

  const canonicalHeaders = `content-type:application/x-amz-json-1.0\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
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
    'X-Amz-Target': target,
    'Authorization': authorizationHeader,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const tableName = Deno.env.get('AWS_DYNAMODB_TABLE_NAME') || 'MyDataNetwork';
    const dynamoDbUrl = `https://dynamodb.${region}.amazonaws.com/`;

    let logs: any[] = [];

    // Query for login logs
    const loginQueryPayload = JSON.stringify({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: `USER_LOGIN#${userId}` }
      },
      ScanIndexForward: false,
      Limit: 50
    });

    const loginHeaders = await signRequest('POST', dynamoDbUrl, loginQueryPayload, region, 'dynamodb', 'DynamoDB_20120810.Query');
    const loginResponse = await fetch(dynamoDbUrl, {
      method: 'POST',
      headers: loginHeaders,
      body: loginQueryPayload,
    });
    const loginResult = await loginResponse.json();

    if (loginResult.Items) {
      logs = logs.concat(loginResult.Items.map((item: any) => ({
        id: item.pk?.S || '',
        timestamp: item.sk?.S || '',
        action: 'login',
        userId: item.user_id?.S || '',
        ipAddress: item.ip_address?.S || '',
        userAgent: item.user_agent?.S || '',
      })));
    }

    // Query for logout logs
    const logoutQueryPayload = JSON.stringify({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: `USER_LOGOUT#${userId}` }
      },
      ScanIndexForward: false,
      Limit: 50
    });

    const logoutHeaders = await signRequest('POST', dynamoDbUrl, logoutQueryPayload, region, 'dynamodb', 'DynamoDB_20120810.Query');
    const logoutResponse = await fetch(dynamoDbUrl, {
      method: 'POST',
      headers: logoutHeaders,
      body: logoutQueryPayload,
    });
    const logoutResult = await logoutResponse.json();

    if (logoutResult.Items) {
      logs = logs.concat(logoutResult.Items.map((item: any) => ({
        id: item.pk?.S || '',
        timestamp: item.sk?.S || '',
        action: 'logout',
        userId: item.user_id?.S || '',
        ipAddress: item.ip_address?.S || '',
        userAgent: item.user_agent?.S || '',
      })));
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`Found ${logs.length} logs for user ${userId}`);

    return new Response(JSON.stringify({ logs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
