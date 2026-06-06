import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireAdmin } from '../_shared/require-admin.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Admin-only — this function can shadow-ban users.
  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const { user_id, text, source = 'message' } = await req.json();
    if (!user_id || !text) {
      return new Response(JSON.stringify({ error: 'user_id and text required' }), { status: 400, headers: corsHeaders });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: kwRow } = await supabase.from('app_settings').select('value').eq('key', 'extortion_keywords').maybeSingle();
    const keywords: string[] = (kwRow?.value as any)?.keywords || [];
    const lower = String(text).toLowerCase();
    const hits = keywords.filter(k => lower.includes(String(k).toLowerCase()));
    if (hits.length === 0) {
      return new Response(JSON.stringify({ flagged: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const severity = hits.length >= 3 ? 'high' : hits.length >= 2 ? 'medium' : 'low';
    const auto = hits.length >= 3 ? 'shadow_ban' : hits.length >= 2 ? 'freeze' : 'none';

    await supabase.from('threat_flags').insert({
      user_id, flag_type: 'extortion_keyword', severity, auto_action: auto,
      evidence: { hits, source, sample: String(text).slice(0, 280) },
    });

    if (auto !== 'none') {
      await supabase.from('account_restrictions').upsert({
        user_id,
        shadow_banned: auto === 'shadow_ban',
        verification_frozen: auto !== 'none',
        reason: `auto: extortion keywords (${hits.join(', ')})`,
      }, { onConflict: 'user_id' });
    }

    await supabase.from('activity_intel').insert({
      event_type: 'threat_detected', user_id, severity: 'warning',
      metadata: { hits, source, auto_action: auto },
    });

    return new Response(JSON.stringify({ flagged: true, severity, auto_action: auto, hits }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
