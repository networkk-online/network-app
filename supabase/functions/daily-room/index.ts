import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAILY_API_URL = 'https://api.daily.co/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
  if (!DAILY_API_KEY) {
    return new Response(JSON.stringify({ error: 'DAILY_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
    authHeader.replace('Bearer ', '')
  );
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const userId = claimsData.claims.sub;

  try {
    const { action, roomId, title } = await req.json();

    switch (action) {
      case 'create': {
        // Create a Daily.co room
        const roomName = `network-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const dailyRes = await fetch(`${DAILY_API_URL}/rooms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'public',
            properties: {
              max_participants: 10,
              enable_chat: true,
              enable_screenshare: true,
              exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
              eject_at_room_exp: true,
            },
          }),
        });

        const dailyRoom = await dailyRes.json();
        if (!dailyRes.ok) {
          throw new Error(`Daily.co API error: ${JSON.stringify(dailyRoom)}`);
        }

        // Create host token with owner privileges
        const tokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              is_owner: true,
              user_id: userId,
              user_name: title || 'المضيف',
              exp: Math.floor(Date.now() / 1000) + 7200,
            },
          }),
        });
        const tokenData = await tokenRes.json();

        // Save to DB
        const { data: room, error: dbError } = await supabase
          .from('live_rooms')
          .insert({
            host_id: userId,
            daily_room_name: roomName,
            daily_room_url: dailyRoom.url,
            title: title || 'بث مباشر',
            status: 'live',
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return new Response(JSON.stringify({
          room,
          token: tokenData.token,
          url: dailyRoom.url,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'join': {
        if (!roomId) throw new Error('roomId required');

        // Get room from DB
        const { data: room, error } = await supabase
          .from('live_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (error || !room) throw new Error('Room not found');

        // Create viewer token
        const tokenRes = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              room_name: room.daily_room_name,
              is_owner: false,
              user_id: userId,
              start_video_off: true,
              start_audio_off: true,
              exp: Math.floor(Date.now() / 1000) + 7200,
            },
          }),
        });
        const tokenData = await tokenRes.json();

        // Increment viewer count
        await supabase
          .from('live_rooms')
          .update({ viewer_count: (room.viewer_count || 0) + 1 })
          .eq('id', roomId);

        return new Response(JSON.stringify({
          room,
          token: tokenData.token,
          url: room.daily_room_url,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'end': {
        if (!roomId) throw new Error('roomId required');

        // Get room
        const { data: room } = await supabase
          .from('live_rooms')
          .select('daily_room_name, host_id')
          .eq('id', roomId)
          .single();

        if (!room || room.host_id !== userId) {
          throw new Error('Not authorized');
        }

        // Delete Daily.co room
        await fetch(`${DAILY_API_URL}/rooms/${room.daily_room_name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
        });

        // Update DB
        await supabase
          .from('live_rooms')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', roomId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Daily room error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
