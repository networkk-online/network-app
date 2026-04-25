import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 signing helper
async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as any,
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

async function signRequest(
  method: string,
  host: string,
  region: string,
  service: string,
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
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256Hash(canonicalRequest);
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = await hmacSha256(kSigning, stringToSign);
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

  return { authorization, amzDate };
}

async function batchWriteToDynamoDB(
  items: any[],
  tableName: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<{ success: boolean; processedCount: number; errors: string[] }> {
  const host = `dynamodb.${region}.amazonaws.com`;
  const endpoint = `https://${host}`;
  const errors: string[] = [];
  let processedCount = 0;

  // DynamoDB BatchWriteItem has a limit of 25 items per request
  const batchSize = 25;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const requestItems: any = {
      [tableName]: batch.map(item => ({
        PutRequest: {
          Item: convertToDynamoDBFormat(item)
        }
      }))
    };

    const payload = JSON.stringify({ RequestItems: requestItems });
    const amzTarget = 'DynamoDB_20120810.BatchWriteItem';

    const { authorization, amzDate } = await signRequest(
      'POST', host, region, 'dynamodb', accessKeyId, secretAccessKey, amzTarget, payload
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
        processedCount += batch.length;
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items written successfully`);
      } else {
        const errorText = await response.text();
        console.error(`Batch write error: ${errorText}`);
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Batch write exception: ${(error as Error).message}`);
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${(error as Error).message}`);
    }
  }

  return { success: errors.length === 0, processedCount, errors };
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
        dynamoItem[key] = { L: value.map(v => convertToDynamoDBFormat({ val: v }).val) };
      }
    } else if (typeof value === 'object') {
      dynamoItem[key] = { M: convertToDynamoDBFormat(value) };
    }
  }

  return dynamoItem;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')!;
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')!;
    const AWS_REGION = Deno.env.get('AWS_REGION')!;
    const AWS_DYNAMODB_TABLE_NAME = Deno.env.get('AWS_DYNAMODB_TABLE_NAME')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Parse request body for options
    let syncOptions = { profiles: true, posts: true, reels: true };
    try {
      const body = await req.json();
      if (body.tables) {
        syncOptions = {
          profiles: body.tables.includes('profiles'),
          posts: body.tables.includes('posts'),
          reels: body.tables.includes('reels')
        };
      }
    } catch {
      // Use default options if no body
    }

    console.log('Starting sync to DynamoDB...');
    console.log('Tables to sync:', syncOptions);

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const results: any = {
      startedAt: new Date().toISOString(),
      tables: {}
    };

    // Sync profiles
    if (syncOptions.profiles) {
      console.log('Fetching profiles...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        results.tables.profiles = { error: profilesError.message };
      } else if (profiles && profiles.length > 0) {
        // Add table identifier and primary key for DynamoDB
        const profileItems = profiles.map(p => ({
          pk: `PROFILE#${p.id}`,
          sk: `PROFILE#${p.id}`,
          entityType: 'PROFILE',
          ...p
        }));

        const syncResult = await batchWriteToDynamoDB(
          profileItems,
          AWS_DYNAMODB_TABLE_NAME,
          AWS_REGION,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY
        );

        results.tables.profiles = {
          total: profiles.length,
          synced: syncResult.processedCount,
          success: syncResult.success,
          errors: syncResult.errors
        };
        console.log(`Profiles synced: ${syncResult.processedCount}/${profiles.length}`);
      } else {
        results.tables.profiles = { total: 0, synced: 0, success: true };
      }
    }

    // Sync posts
    if (syncOptions.posts) {
      console.log('Fetching posts...');
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*');

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        results.tables.posts = { error: postsError.message };
      } else if (posts && posts.length > 0) {
        const postItems = posts.map(p => ({
          pk: `POST#${p.id}`,
          sk: `USER#${p.user_id}`,
          entityType: 'POST',
          ...p
        }));

        const syncResult = await batchWriteToDynamoDB(
          postItems,
          AWS_DYNAMODB_TABLE_NAME,
          AWS_REGION,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY
        );

        results.tables.posts = {
          total: posts.length,
          synced: syncResult.processedCount,
          success: syncResult.success,
          errors: syncResult.errors
        };
        console.log(`Posts synced: ${syncResult.processedCount}/${posts.length}`);
      } else {
        results.tables.posts = { total: 0, synced: 0, success: true };
      }
    }

    // Sync reels
    if (syncOptions.reels) {
      console.log('Fetching reels...');
      const { data: reels, error: reelsError } = await supabase
        .from('reels')
        .select('*');

      if (reelsError) {
        console.error('Error fetching reels:', reelsError);
        results.tables.reels = { error: reelsError.message };
      } else if (reels && reels.length > 0) {
        const reelItems = reels.map(r => ({
          pk: `REEL#${r.id}`,
          sk: `USER#${r.user_id}`,
          entityType: 'REEL',
          ...r
        }));

        const syncResult = await batchWriteToDynamoDB(
          reelItems,
          AWS_DYNAMODB_TABLE_NAME,
          AWS_REGION,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY
        );

        results.tables.reels = {
          total: reels.length,
          synced: syncResult.processedCount,
          success: syncResult.success,
          errors: syncResult.errors
        };
        console.log(`Reels synced: ${syncResult.processedCount}/${reels.length}`);
      } else {
        results.tables.reels = { total: 0, synced: 0, success: true };
      }
    }

    results.completedAt = new Date().toISOString();
    results.success = Object.values(results.tables).every((t: any) => t.success !== false);

    console.log('Sync completed:', results);

    return new Response(
      JSON.stringify({
        success: results.success,
        message: results.success ? 'تمت مزامنة جميع البيانات بنجاح!' : 'تمت المزامنة مع بعض الأخطاء',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ أثناء المزامنة',
        details: (error as Error).message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
