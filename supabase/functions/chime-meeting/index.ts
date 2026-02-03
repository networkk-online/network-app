import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS SigV4 signing for Chime
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

async function signChimeRequest(
  method: string,
  host: string,
  path: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  payload: string
): Promise<{ authorization: string; amzDate: string }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  const contentType = 'application/json';
  const service = 'chime';

  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';

  const payloadHash = await sha256Hash(payload);
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

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

async function createChimeMeeting(
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  externalMeetingId: string
): Promise<any> {
  const host = `meetings-chime.${region}.amazonaws.com`;
  const path = '/meetings';
  const endpoint = `https://${host}${path}`;

  const payload = JSON.stringify({
    ClientRequestToken: crypto.randomUUID(),
    ExternalMeetingId: externalMeetingId,
    MediaRegion: region
  });

  const { authorization, amzDate } = await signChimeRequest(
    'POST', host, path, region, accessKeyId, secretAccessKey, payload
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorization,
    },
    body: payload
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create meeting: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function createChimeAttendee(
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  meetingId: string,
  externalUserId: string
): Promise<any> {
  const host = `meetings-chime.${region}.amazonaws.com`;
  const path = `/meetings/${meetingId}/attendees`;
  const endpoint = `https://${host}${path}`;

  const payload = JSON.stringify({
    ExternalUserId: externalUserId
  });

  const { authorization, amzDate } = await signChimeRequest(
    'POST', host, path, region, accessKeyId, secretAccessKey, payload
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorization,
    },
    body: payload
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create attendee: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function deleteChimeMeeting(
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  meetingId: string
): Promise<void> {
  const host = `meetings-chime.${region}.amazonaws.com`;
  const path = `/meetings/${meetingId}`;
  const endpoint = `https://${host}${path}`;

  const { authorization, amzDate } = await signChimeRequest(
    'DELETE', host, path, region, accessKeyId, secretAccessKey, ''
  );

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Date': amzDate,
      'Authorization': authorization,
    }
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    console.error(`Failed to delete meeting: ${response.status} - ${errorText}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Missing AWS credentials');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, callerId, receiverId, callType, meetingId } = body;

    if (action === 'create_meeting') {
      // إنشاء اجتماع جديد للمكالمة
      console.log(`Creating Chime meeting: ${callerId} -> ${receiverId} (${callType})`);

      // AWS Chime requires externalMeetingId <= 64 chars
      // UUIDs are 36 chars each, so we use first 8 chars of each
      const externalMeetingId = `call_${callerId.substring(0, 8)}_${receiverId.substring(0, 8)}_${Date.now()}`;
      
      // 1. إنشاء الاجتماع
      const meetingResponse = await createChimeMeeting(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        externalMeetingId
      );

      const meeting = meetingResponse.Meeting;
      console.log(`✅ Meeting created: ${meeting.MeetingId}`);

      // 2. إنشاء حضور للمتصل
      const callerAttendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meeting.MeetingId,
        callerId
      );

      // 3. إنشاء حضور للمستقبل
      const receiverAttendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meeting.MeetingId,
        receiverId
      );

      console.log(`✅ Attendees created for meeting ${meeting.MeetingId}`);

      // 4. حفظ معلومات المكالمة في call_history
      const { error: insertError } = await supabase
        .from('call_history')
        .insert({
          caller_id: callerId,
          receiver_id: receiverId,
          call_type: callType,
          status: 'ringing',
          started_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error saving call history:', insertError);
      }

      // 5. إرسال إشعار للمستقبل عبر call_signals
      const { error: signalError } = await supabase
        .from('call_signals')
        .insert({
          call_id: meeting.MeetingId,
          from_user_id: callerId,
          to_user_id: receiverId,
          signal_type: 'chime_offer',
          signal_data: {
            meetingId: meeting.MeetingId,
            callType: callType,
            attendeeInfo: receiverAttendeeResponse.Attendee
          }
        });

      if (signalError) {
        console.error('Error sending signal:', signalError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          meeting: {
            MeetingId: meeting.MeetingId,
            MediaPlacement: meeting.MediaPlacement,
            MediaRegion: meeting.MediaRegion
          },
          attendee: callerAttendeeResponse.Attendee,
          receiverAttendee: receiverAttendeeResponse.Attendee
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'join_meeting') {
      // انضمام لاجتماع موجود (للمستقبل)
      console.log(`Joining Chime meeting: ${meetingId} by ${user.id}`);

      const attendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meetingId,
        user.id
      );

      // تحديث حالة المكالمة
      await supabase
        .from('call_history')
        .update({ status: 'connected' })
        .eq('caller_id', callerId)
        .eq('receiver_id', receiverId)
        .is('ended_at', null);

      return new Response(
        JSON.stringify({
          success: true,
          attendee: attendeeResponse.Attendee
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'end_meeting') {
      // إنهاء الاجتماع
      console.log(`Ending Chime meeting: ${meetingId}`);

      await deleteChimeMeeting(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meetingId
      );

      // تحديث سجل المكالمات
      const now = new Date().toISOString();
      await supabase
        .from('call_history')
        .update({ 
          status: 'ended',
          ended_at: now
        })
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .is('ended_at', null);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Meeting ended successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject_call') {
      // رفض المكالمة
      console.log(`Rejecting call: ${meetingId}`);

      if (meetingId) {
        await deleteChimeMeeting(
          AWS_REGION,
          AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY,
          meetingId
        );
      }

      // إرسال إشارة رفض
      await supabase
        .from('call_signals')
        .insert({
          call_id: meetingId || crypto.randomUUID(),
          from_user_id: user.id,
          to_user_id: callerId,
          signal_type: 'rejected',
          signal_data: { reason: 'User declined' }
        });

      // تحديث سجل المكالمات
      await supabase
        .from('call_history')
        .update({ status: 'rejected', ended_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .is('ended_at', null);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Call rejected'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Use: create_meeting, join_meeting, end_meeting, reject_call'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Chime meeting error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'حدث خطأ في إدارة المكالمة',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
