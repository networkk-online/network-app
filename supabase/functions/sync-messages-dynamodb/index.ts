import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS SigV4 signing helper
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

async function sha256Hash(message: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signDynamoDBRequest(
  method: string,
  host: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  amzTarget: string,
  payload: string
): Promise<{ authorization: string; amzDate: string }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  const contentType = 'application/x-amz-json-1.0';

  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${amzTarget}\n`;
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';

  const payloadHash = await sha256Hash(payload);
  const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/dynamodb/aws4_request`;
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 'dynamodb');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = await hmacSha256(kSigning, stringToSign);
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

  return { authorization, amzDate };
}

function convertToDynamoDBFormat(item: any): any {
  const dynamoItem: any = {};

  for (const [key, value] of Object.entries(item)) {
    if (value === null || value === undefined) {
      dynamoItem[key] = { NULL: true };
    } else if (typeof value === 'string') {
      dynamoItem[key] = { S: value };
    } else if (typeof value === 'number') {
      dynamoItem[key] = { N: value.toString() };
    } else if (typeof value === 'boolean') {
      dynamoItem[key] = { BOOL: value };
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        dynamoItem[key] = { L: [] };
      } else if (typeof value[0] === 'string') {
        dynamoItem[key] = { SS: value };
      } else if (typeof value[0] === 'number') {
        dynamoItem[key] = { NS: value.map(v => v.toString()) };
      } else {
        dynamoItem[key] = { L: value.map(v => ({ M: convertToDynamoDBFormat(v) })) };
      }
    } else if (typeof value === 'object') {
      dynamoItem[key] = { M: convertToDynamoDBFormat(value) };
    }
  }

  return dynamoItem;
}

async function writeToDynamoDB(
  item: any,
  tableName: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<{ success: boolean; error?: string }> {
  const host = `dynamodb.${region}.amazonaws.com`;
  const endpoint = `https://${host}`;
  const amzTarget = 'DynamoDB_20120810.PutItem';

  const payload = JSON.stringify({
    TableName: tableName,
    Item: convertToDynamoDBFormat(item),
    ConditionExpression: 'attribute_not_exists(pk)' // Prevent overwrites
  });

  const { authorization, amzDate } = await signDynamoDBRequest(
    'POST', host, region, accessKeyId, secretAccessKey, amzTarget, payload
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.0',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': amzTarget,
        'Authorization': authorization,
      },
      body: payload
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      // If item already exists, consider it success
      if (errorText.includes('ConditionalCheckFailedException')) {
        return { success: true };
      }
      console.error(`DynamoDB write error: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`DynamoDB write exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION');
    const AWS_DYNAMODB_TABLE_NAME = Deno.env.get('AWS_DYNAMODB_TABLE_NAME');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_DYNAMODB_TABLE_NAME) {
      throw new Error('Missing AWS configuration secrets');
    }

    const body = await req.json();
    const { action, message, messages } = body;

    if (action === 'sync_single' && message) {
      // مزامنة رسالة واحدة فوراً
      console.log(`Syncing single message: ${message.id}`);

      const dynamoItem = {
        pk: `MESSAGE#${message.id}`,
        sk: `CONVERSATION#${message.conversation_id}#${message.created_at}`,
        entityType: 'MESSAGE',
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content || '',
        media_url: message.media_url || null,
        media_type: message.media_type || null,
        is_read: message.is_read || false,
        created_at: message.created_at,
        synced_at: new Date().toISOString(),
        // GSI for querying messages by conversation
        gsi1pk: `CONVERSATION#${message.conversation_id}`,
        gsi1sk: message.created_at
      };

      const result = await writeToDynamoDB(
        dynamoItem,
        AWS_DYNAMODB_TABLE_NAME,
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY
      );

      if (!result.success) {
        console.error('Failed to sync message to DynamoDB:', result.error);
        // Don't throw - message is already saved in Supabase
        return new Response(
          JSON.stringify({
            success: false,
            message: 'فشل المزامنة مع DynamoDB',
            error: result.error,
            supabase_saved: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Message ${message.id} synced to DynamoDB`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'تمت المزامنة بنجاح',
          synced_id: message.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'sync_batch' && messages && Array.isArray(messages)) {
      // مزامنة دفعة من الرسائل
      console.log(`Syncing batch of ${messages.length} messages`);

      const results = await Promise.allSettled(
        messages.map(async (msg) => {
          const dynamoItem = {
            pk: `MESSAGE#${msg.id}`,
            sk: `CONVERSATION#${msg.conversation_id}#${msg.created_at}`,
            entityType: 'MESSAGE',
            id: msg.id,
            conversation_id: msg.conversation_id,
            sender_id: msg.sender_id,
            content: msg.content || '',
            media_url: msg.media_url || null,
            media_type: msg.media_type || null,
            is_read: msg.is_read || false,
            created_at: msg.created_at,
            synced_at: new Date().toISOString(),
            gsi1pk: `CONVERSATION#${msg.conversation_id}`,
            gsi1sk: msg.created_at
          };

          return writeToDynamoDB(
            dynamoItem,
            AWS_DYNAMODB_TABLE_NAME!,
            AWS_REGION!,
            AWS_ACCESS_KEY_ID!,
            AWS_SECRET_ACCESS_KEY!
          );
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failedCount = results.length - successCount;

      console.log(`✅ Batch sync complete: ${successCount} success, ${failedCount} failed`);

      return new Response(
        JSON.stringify({
          success: failedCount === 0,
          message: `تمت مزامنة ${successCount}/${messages.length} رسالة`,
          synced: successCount,
          failed: failedCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Use sync_single or sync_batch'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ أثناء المزامنة',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
