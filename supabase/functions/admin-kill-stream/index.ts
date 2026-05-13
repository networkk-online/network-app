import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return resp({ error: 'Unauthorized' }, 401);

    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error } = await supa.auth.getClaims(token);
    if (error || !claims?.claims) return resp({ error: 'Unauthorized' }, 401);
    const adminId = claims.claims.sub as string;

    // Verify admin role
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminId);
    const isAdmin = roles?.some((r) => r.role === 'admin' || r.role === 'owner');
    if (!isAdmin) return resp({ error: 'Forbidden' }, 403);

    const { stream_id, reason } = await req.json();
    if (!stream_id) return resp({ error: 'Missing stream_id' }, 400);

    const { error: uErr } = await admin
      .from('live_streams')
      .update({
        status: 'killed',
        killed_by: adminId,
        killed_reason: reason ?? 'admin action',
        ended_at: new Date().toISOString(),
      })
      .eq('id', stream_id);

    if (uErr) return resp({ error: uErr.message }, 500);

    await admin.from('security_events').insert({
      user_id: adminId,
      event_type: 'live_stream_killed',
      severity: 'warning',
      details: { stream_id, reason },
    });

    return resp({ ok: true });
  } catch (e: any) {
    return resp({ error: e?.message || 'Server error' }, 500);
  }
});

function resp(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
