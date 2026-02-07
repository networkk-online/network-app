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

// Mock mode handler for testing without AWS credentials
async function handleMockMode(
  action: string,
  callerId: string,
  receiverId: string,
  callType: string,
  meetingId: string | null,
  userId: string,
  supabase: any
): Promise<Response> {
  const mockMeetingId = meetingId || `mock_${crypto.randomUUID()}`;
  
  if (action === 'create_meeting') {
    console.log(`[MOCK] Creating meeting: ${callerId} -> ${receiverId} (${callType})`);
    
    // Save to call_history
    await supabase.from('call_history').insert({
      caller_id: callerId,
      receiver_id: receiverId,
      call_type: callType,
      status: 'ringing',
      started_at: new Date().toISOString()
    });

    // Send signal to receiver
    await supabase.from('call_signals').insert({
      call_id: mockMeetingId,
      from_user_id: callerId,
      to_user_id: receiverId,
      signal_type: 'chime_offer',
      signal_data: {
        meetingId: mockMeetingId,
        callType: callType,
        mockMode: true,
        attendeeInfo: { AttendeeId: `mock_attendee_${receiverId.substring(0, 8)}`, JoinToken: 'mock_token' }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        mockMode: true,
        meeting: {
          MeetingId: mockMeetingId,
          MediaPlacement: { AudioHostUrl: 'mock://audio', VideoHostUrl: 'mock://video' },
          MediaRegion: 'us-east-1'
        },
        attendee: { AttendeeId: `mock_attendee_${callerId.substring(0, 8)}`, JoinToken: 'mock_token' },
        receiverAttendee: { AttendeeId: `mock_attendee_${receiverId.substring(0, 8)}`, JoinToken: 'mock_token' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } else if (action === 'join_meeting') {
    console.log(`[MOCK] Joining meeting: ${meetingId}`);
    
    await supabase.from('call_history')
      .update({ status: 'connected' })
      .eq('caller_id', callerId)
      .eq('receiver_id', receiverId)
      .is('ended_at', null);

    return new Response(
      JSON.stringify({
        success: true,
        mockMode: true,
        attendee: { AttendeeId: `mock_attendee_${userId.substring(0, 8)}`, JoinToken: 'mock_token' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } else if (action === 'end_meeting' || action === 'reject_call') {
    console.log(`[MOCK] Ending/Rejecting call: ${meetingId}`);
    
    const status = action === 'reject_call' ? 'rejected' : 'ended';
    await supabase.from('call_history')
      .update({ status, ended_at: new Date().toISOString() })
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .is('ended_at', null);

    if (action === 'reject_call' && callerId) {
      await supabase.from('call_signals').insert({
        call_id: mockMeetingId,
        from_user_id: userId,
        to_user_id: callerId,
        signal_type: 'rejected',
        signal_data: { reason: 'User declined', mockMode: true }
      });
    }

    return new Response(
      JSON.stringify({ success: true, mockMode: true, message: `Call ${status}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: false, error: 'Invalid action' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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
    const { action, callerId, receiverId, callType, meetingId, mockMode } = body;

    // Check if mock mode is enabled OR if AWS credentials are missing
    const useMockMode = mockMode === true || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY;
    
    if (useMockMode) {
      console.log('🔧 Using MOCK MODE for Chime meeting (AWS credentials missing or mock requested)');
      return handleMockMode(action, callerId, receiverId, callType, meetingId, user.id, supabase);
    }

    if (action === 'create_meeting') {
      console.log(`Creating Chime meeting: ${callerId} -> ${receiverId} (${callType})`);

      const externalMeetingId = `call_${callerId.substring(0, 8)}_${receiverId.substring(0, 8)}_${Date.now()}`;
      
      const meetingResponse = await createChimeMeeting(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        externalMeetingId
      );

      const meeting = meetingResponse.Meeting;
      console.log(`✅ Meeting created: ${meeting.MeetingId}`);

      const callerAttendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meeting.MeetingId,
        callerId
      );

      const receiverAttendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meeting.MeetingId,
        receiverId
      );

      console.log(`✅ Attendees created for meeting ${meeting.MeetingId}`);

      await supabase.from('call_history').insert({
        caller_id: callerId,
        receiver_id: receiverId,
        call_type: callType,
        status: 'ringing',
        started_at: new Date().toISOString()
      });

      await supabase.from('call_signals').insert({
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
      console.log(`Joining Chime meeting: ${meetingId} by ${user.id}`);

      const attendeeResponse = await createChimeAttendee(
        AWS_REGION,
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        meetingId,
        user.id
      );

      await supabase.from('call_history')
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
      console.log(`Ending Chime meeting: ${meetingId}`);

      await deleteChimeMeeting(AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, meetingId);

      await supabase.from('call_history')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .is('ended_at', null);

      return new Response(
        JSON.stringify({ success: true, message: 'Meeting ended successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject_call') {
      console.log(`Rejecting call: ${meetingId}`);

      if (meetingId) {
        await deleteChimeMeeting(AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, meetingId);
      }

      await supabase.from('call_signals').insert({
        call_id: meetingId || crypto.randomUUID(),
        from_user_id: user.id,
        to_user_id: callerId,
        signal_type: 'rejected',
        signal_data: { reason: 'User declined' }
      });

      await supabase.from('call_history')
        .update({ status: 'rejected', ended_at: new Date().toISOString() })
        .eq('receiver_id', user.id)
        .is('ended_at', null);

      return new Response(
        JSON.stringify({ success: true, message: 'Call rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
