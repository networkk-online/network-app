import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function deviceLabel(ua: string): string {
  const u = ua.toLowerCase();
  let os = 'Unknown OS';
  if (u.includes('windows')) os = 'Windows';
  else if (u.includes('mac os') || u.includes('macintosh')) os = 'macOS';
  else if (u.includes('android')) os = 'Android';
  else if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) os = 'iOS';
  else if (u.includes('linux')) os = 'Linux';
  let browser = 'Browser';
  if (u.includes('edg/')) browser = 'Edge';
  else if (u.includes('chrome/')) browser = 'Chrome';
  else if (u.includes('safari/') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('firefox/')) browser = 'Firefox';
  return `${browser} • ${os}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const admin = createClient(supabaseUrl, serviceKey);

    // Detect IP and UA
    const fwd = req.headers.get('x-forwarded-for') || '';
    const ip = (fwd.split(',')[0] || req.headers.get('x-real-ip') || '').trim() || 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';
    const uaHash = (await sha256(ua)).slice(0, 32);
    const device = deviceLabel(ua);

    // Check history for new IP / new device
    const { data: prior } = await admin
      .from('login_history')
      .select('ip_address, user_agent_hash')
      .eq('user_id', user.id)
      .limit(500);

    const knownIps = new Set((prior ?? []).map(r => r.ip_address));
    const knownDevices = new Set((prior ?? []).map(r => r.user_agent_hash));
    const isNewIp = !!ip && ip !== 'unknown' && !knownIps.has(ip);
    const isNewDevice = !knownDevices.has(uaHash);
    const isFirstEver = (prior ?? []).length === 0;

    // Geo lookup (best-effort)
    let city = '', country = '', countryCode = '', isp = '';
    if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.')) {
      try {
        const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp`);
        const j = await r.json();
        if (j.status === 'success') {
          city = j.city || '';
          country = j.country || '';
          countryCode = j.countryCode || '';
          isp = j.isp || '';
        }
      } catch (_) { /* ignore */ }
    }

    // Insert login record
    await admin.from('login_history').insert({
      user_id: user.id,
      ip_address: ip,
      user_agent: ua,
      user_agent_hash: uaHash,
      device_label: device,
      city, country, country_code: countryCode, isp,
      is_new_device: isNewDevice && !isFirstEver,
      is_new_ip: isNewIp && !isFirstEver,
    });

    // Send security alert if new (and not the very first login)
    if (!isFirstEver && (isNewIp || isNewDevice)) {
      const loc = [city, country].filter(Boolean).join(', ') || 'موقع غير معروف';
      const reasons: string[] = [];
      if (isNewDevice) reasons.push('جهاز جديد');
      if (isNewIp) reasons.push('عنوان IP جديد');

      const titleAr = '🔐 تنبيه أمني: تسجيل دخول جديد';
      const contentAr =
        `Security Audit | تدقيق أمني\n\n` +
        `تم تسجيل دخول إلى حسابك من ${reasons.join(' و ')}.\n\n` +
        `📍 الموقع: ${loc}\n` +
        `💻 الجهاز: ${device}\n` +
        `🌐 IP: ${ip}\n` +
        `🕐 الوقت: ${new Date().toLocaleString('ar-IQ')}\n\n` +
        `إذا لم يكن هذا أنت، قم بتغيير كلمة السر فورًا وفعّل المصادقة الثنائية (2FA).`;

      await admin.from('system_messages').insert({
        user_id: user.id,
        event_type: 'security_new_login',
        title: titleAr,
        content: contentAr,
        severity: isNewDevice && isNewIp ? 'critical' : 'warning',
        is_from_bot: true,
        metadata: { ip, city, country, device, user_agent: ua, is_new_ip: isNewIp, is_new_device: isNewDevice },
      });
    }

    return new Response(
      JSON.stringify({ success: true, is_new_ip: isNewIp, is_new_device: isNewDevice, first: isFirstEver }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('track-login error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
