import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser } from "../_shared/require-user.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ACTIONS = new Set(['login', 'logout', 'visit']);

// AWS SigV4 signing
async function signRequest(method: string, url: string, body: string, region: string, service: string) {
  const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID') || '';
  const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY') || '';
  
  const encoder = new TextEncoder();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  const urlObj = new URL(url);
  const host = urlObj.host;
  const canonicalUri = urlObj.pathname || '/';
  const canonicalQuerystring = '';
  
  const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(body));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalHeaders = `content-type:application/x-amz-json-1.0\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:DynamoDB_20120810.PutItem\n`;
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
  
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;
  
  async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key as any, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }
  
  const kDate = await hmacSha256(encoder.encode('AWS4' + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  
  const signature = await hmacSha256(kSigning, stringToSign);
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  
  return {
    'Content-Type': 'application/x-amz-json-1.0',
    'X-Amz-Date': amzDate,
    'X-Amz-Target': 'DynamoDB_20120810.PutItem',
    'Authorization': authorizationHeader,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req, corsHeaders);
  if ('response' in auth) return auth.response;
  const userId = auth.userId;

  try {
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';
    const tableName = Deno.env.get('AWS_DYNAMODB_TABLE_NAME') || 'MyDataNetwork';

    let action = 'visit';
    try {
      const body = await req.json();
      if (typeof body.action === 'string' && ALLOWED_ACTIONS.has(body.action)) {
        action = body.action;
      }
    } catch {
      // ignore body parse errors
    }

    const userIP = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();


    // تحضير البيانات لـ DynamoDB
    const payload = {
      TableName: tableName,
      Item: {
        pk: { S: `USER_${action.toUpperCase()}#${id}` },
        sk: { S: timestamp },
        id: { S: id },
        user_id: { S: userId },
        action: { S: action },
        user_ip: { S: userIP },
        user_agent: { S: userAgent },
        timestamp: { S: timestamp },
        type: { S: 'user_activity' }
      }
    };

    const body = JSON.stringify(payload);
    const url = `https://dynamodb.${region}.amazonaws.com/`;
    
    // توقيع الطلب
    const headers = await signRequest('POST', url, body, region, 'dynamodb');
    
    // إرسال البيانات إلى DynamoDB
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('خطأ DynamoDB:', errorText);
      throw new Error(`DynamoDB error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ تم تسجيل ${action} بنجاح - ID: ${id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `تم تسجيل ${action} بنجاح`,
        id,
        timestamp
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    console.error('خطأ:', (err as Error).message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (err as Error).message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
