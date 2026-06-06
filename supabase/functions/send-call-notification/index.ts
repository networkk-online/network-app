import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/require-user.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallNotificationRequest {
  receiverId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
  callId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authenticated user
  const auth = await requireUser(req, corsHeaders);
  if ('response' in auth) return auth.response;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { receiverId, callerId, callerName, callerAvatar, callType, callId }: CallNotificationRequest = await req.json();

    // Caller identity must match authenticated user — prevents spoofing.
    if (!callerId || callerId !== auth.userId) {
      return new Response(
        JSON.stringify({ error: 'callerId must match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!receiverId || !callId || !callType) {
      return new Response(
        JSON.stringify({ error: 'receiverId, callId, and callType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', receiverId);

    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationData = {
      user_id: receiverId,
      actor_id: callerId,
      type: 'incoming_call',
      content: JSON.stringify({
        callType,
        callId,
        callerName,
        callerAvatar,
        title: callType === 'video' ? '📹 مكالمة فيديو واردة' : '📞 مكالمة صوتية واردة',
        body: `${callerName} يتصل بك`,
      }),
      is_read: false,
    };

    await supabase.from('notifications').insert(notificationData);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent', tokensCount: tokens.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending call notification:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
