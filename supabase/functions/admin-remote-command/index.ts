import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const supaUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims } = await supaUser.auth.getClaims(token);
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const adminId = claims.claims.sub as string;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', adminId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { action, target_user_id, payload = {} } = await req.json();

    const log = async (event: string, meta: any) => {
      await admin.from('activity_intel').insert({
        event_type: event, user_id: adminId, severity: 'critical',
        metadata: { admin_id: adminId, target: target_user_id, ...meta },
      });
    };

    switch (action) {
      case 'kill_live': {
        await admin.from('live_streams').update({ status: 'killed', ended_at: new Date().toISOString() })
          .eq('host_id', target_user_id).eq('status', 'live');
        await log('admin_kill_live', payload);
        break;
      }
      case 'revoke_sessions': {
        if (target_user_id) await admin.auth.admin.signOut(target_user_id);
        await log('admin_revoke_sessions', payload);
        break;
      }
      case 'shadow_ban': {
        await admin.from('account_restrictions').upsert({
          user_id: target_user_id, shadow_banned: true, verification_frozen: true,
          reason: payload.reason || 'admin shadow ban', imposed_by: adminId,
        }, { onConflict: 'user_id' });
        await log('admin_shadow_ban', payload);
        break;
      }
      case 'lift_restriction': {
        await admin.from('account_restrictions').upsert({
          user_id: target_user_id, shadow_banned: false, verification_frozen: false,
          reason: 'lifted by admin', imposed_by: adminId,
        }, { onConflict: 'user_id' });
        await log('admin_lift_restriction', payload);
        break;
      }
      case 'set_maintenance': {
        const enabled = !!payload.enabled;
        await admin.from('app_settings').upsert({
          key: 'maintenance_mode',
          value: { enabled, message: payload.message || 'التطبيق تحت الصيانة' },
        }, { onConflict: 'key' });
        await log('admin_set_maintenance', { enabled });
        break;
      }
      default:
        return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
