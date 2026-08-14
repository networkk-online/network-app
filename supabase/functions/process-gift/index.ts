import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

const RATE_LIMIT = 60; // gifts/min per user (durable, shared across instances)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401);
    const senderId = claims.claims.sub as string;

    // Durable rate limit (survives cold starts / multiple instances)
    const limited = await enforceRateLimit({
      bucket: 'process-gift', identifier: senderId, max: RATE_LIMIT, windowSeconds: 60,
      corsHeaders, message: 'Rate limit exceeded',
    });
    if (limited) return limited;

    const body = await req.json();
    const {
      creator_id,
      gift_id,
      gift_name,
      unit_price,
      quantity = 1,
      channel_name,
      stream_id,
    } = body || {};

    if (!creator_id || !gift_id || typeof unit_price !== 'number' || unit_price < 0) {
      return json({ error: 'Invalid payload' }, 400);
    }
    if (creator_id === senderId) {
      return json({ error: 'Cannot gift yourself' }, 400);
    }
    if (quantity < 1 || quantity > 999) return json({ error: 'Invalid quantity' }, 400);

    const total = Number((unit_price * quantity).toFixed(2));

    // Service role for ledger insert + finance updates
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch dynamic commission
    const { data: settings } = await admin
      .from('app_settings_finance')
      .select('platform_commission_rate')
      .eq('id', 1)
      .single();
    const rate = Number(settings?.platform_commission_rate ?? 0.20);
    const platform_fee = Number((total * rate).toFixed(2));
    const creator_earning = Number((total - platform_fee).toFixed(2));

    // Verify & deduct sender's gems (server-side authoritative)
    const { data: gems, error: gErr } = await admin
      .from('user_gems')
      .select('balance, total_spent')
      .eq('user_id', senderId)
      .single();
    if (gErr || !gems) return json({ error: 'No gems wallet' }, 400);
    if (Number(gems.balance) < total) return json({ error: 'رصيد الجواهر غير كافٍ' }, 402);

    const { error: dErr } = await admin
      .from('user_gems')
      .update({
        balance: Number(gems.balance) - total,
        total_spent: Number(gems.total_spent ?? 0) + total,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', senderId);
    if (dErr) return json({ error: 'Failed to deduct gems', detail: dErr.message }, 500);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null;
    const ua = req.headers.get('user-agent') || null;

    // Insert ledger row (trigger credits creator)
    const { data: ledger, error: lErr } = await admin
      .from('gift_ledger')
      .insert({
        sender_id: senderId,
        creator_id,
        channel_name: channel_name ?? null,
        stream_id: stream_id ?? null,
        gift_id,
        gift_name: gift_name ?? gift_id,
        quantity,
        unit_price,
        total_price: total,
        platform_fee,
        creator_earning,
        commission_rate: rate,
        status: 'confirmed',
        ip_address: ip,
        user_agent: ua,
      })
      .select()
      .single();

    if (lErr) {
      // refund gems on ledger failure
      await admin
        .from('user_gems')
        .update({ balance: Number(gems.balance), updated_at: new Date().toISOString() })
        .eq('user_id', senderId);
      return json({ error: 'Ledger failed', detail: lErr.message }, 500);
    }

    return json({ ok: true, ledger_id: ledger.id, creator_earning, platform_fee, rate }, 200);
  } catch (e: any) {
    console.error('process-gift error', e);
    return json({ error: e?.message || 'Server error' }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
