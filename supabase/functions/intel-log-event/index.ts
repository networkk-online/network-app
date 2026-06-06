import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUser } from '../_shared/require-user.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseUA(ua: string) {
  const lower = (ua || '').toLowerCase();
  let device = 'desktop';
  if (/iphone|ipad|ipod/.test(lower)) device = 'iOS';
  else if (/android/.test(lower)) device = 'Android';
  else if (/mobile/.test(lower)) device = 'mobile';
  let os = 'unknown';
  const m = ua?.match(/\(([^)]+)\)/);
  if (m) os = m[1].split(';')[0].trim();
  return { device, os };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Require authenticated user
  const auth = await requireUser(req, corsHeaders);
  if ('response' in auth) return auth.response;

  try {
    const body = await req.json();
    const { event_type, severity = 'info', metadata = {} } = body;
    if (!event_type) return new Response(JSON.stringify({ error: 'event_type required' }), { status: 400, headers: corsHeaders });

    // Force user_id to the authenticated caller — prevents spoofing events against others.
    const user_id = auth.userId;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
    const ua = req.headers.get('user-agent') || '';
    const { device, os } = parseUA(ua);

    let country = null, city = null;
    try {
      if (ip && ip !== 'unknown') {
        const geo = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2500) });
        if (geo.ok) {
          const g = await geo.json();
          country = g.country_name || g.country;
          city = g.city;
        }
      }
    } catch (_) { /* ignore geo errors */ }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await supabase.from('activity_intel').insert({
      event_type, user_id, severity, ip, country, city, device, os, metadata,
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
