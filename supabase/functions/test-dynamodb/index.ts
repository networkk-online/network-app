import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION');
    const AWS_DYNAMODB_TABLE_NAME = Deno.env.get('AWS_DYNAMODB_TABLE_NAME');

    console.log('Testing AWS DynamoDB connection...');
    console.log('Region:', AWS_REGION);
    console.log('Table:', AWS_DYNAMODB_TABLE_NAME);
    console.log('Access Key ID exists:', !!AWS_ACCESS_KEY_ID);
    console.log('Secret Access Key exists:', !!AWS_SECRET_ACCESS_KEY);

    // Check if all required env vars are set
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_DYNAMODB_TABLE_NAME) {
      const missing = [];
      if (!AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
      if (!AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
      if (!AWS_REGION) missing.push('AWS_REGION');
      if (!AWS_DYNAMODB_TABLE_NAME) missing.push('AWS_DYNAMODB_TABLE_NAME');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required environment variables',
          missing: missing
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create AWS Signature Version 4 for DynamoDB DescribeTable
    const host = `dynamodb.${AWS_REGION}.amazonaws.com`;
    const endpoint = `https://${host}`;
    const service = 'dynamodb';
    const method = 'POST';
    const amzTarget = 'DynamoDB_20120810.DescribeTable';
    const contentType = 'application/x-amz-json-1.0';
    
    const payload = JSON.stringify({
      TableName: AWS_DYNAMODB_TABLE_NAME
    });

    // Get current time in required format
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    // Create canonical request
    const canonicalUri = '/';
    const canonicalQuerystring = '';
    const canonicalHeaders = 
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-date:${amzDate}\n` +
      `x-amz-target:${amzTarget}\n`;
    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';

    // Hash payload
    const payloadHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(payload)
    );
    const payloadHashHex = Array.from(new Uint8Array(payloadHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const canonicalRequest = 
      `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
    
    const canonicalRequestHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonicalRequest)
    );
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHashHex}`;

    // Calculate signature
    async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
    }

    const kDate = await hmacSha256(
      new TextEncoder().encode('AWS4' + AWS_SECRET_ACCESS_KEY),
      dateStamp
    );
    const kRegion = await hmacSha256(kDate, AWS_REGION);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, 'aws4_request');
    const signature = await hmacSha256(kSigning, stringToSign);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const authorizationHeader = 
      `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    // Make request to DynamoDB
    console.log('Sending request to DynamoDB...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Amz-Date': amzDate,
        'X-Amz-Target': amzTarget,
        'Authorization': authorizationHeader,
      },
      body: payload
    });

    const responseText = await response.text();
    console.log('DynamoDB response status:', response.status);
    console.log('DynamoDB response:', responseText);

    if (response.ok) {
      const tableInfo = JSON.parse(responseText);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'تم الاتصال بـ DynamoDB بنجاح!',
          table: {
            name: tableInfo.Table?.TableName,
            status: tableInfo.Table?.TableStatus,
            itemCount: tableInfo.Table?.ItemCount,
            createdAt: tableInfo.Table?.CreationDateTime
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'فشل الاتصال بـ DynamoDB',
          details: responseText,
          statusCode: response.status
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error testing DynamoDB connection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ أثناء اختبار الاتصال',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
