// Signed provider webhook — the ONLY path that can mark a marketplace order as
// paid. Every event is logged, signature-verified and de-duplicated.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { getProvider } from '../_shared/mpProviders.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const providerCode = (url.searchParams.get('provider') || 'gateway').slice(0, 40);
  const adapter = getProvider(providerCode);
  if (!adapter) return json({ error: 'unknown provider' }, 400);

  const raw = await req.text();
  if (raw.length > 200_000) return json({ error: 'payload too large' }, 413);

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const valid = await adapter.verifyWebhook(raw, req.headers);
  const parsed = adapter.parseEvent(payload);

  // Log first (idempotency guard on provider + event_id).
  const { data: logged, error: logErr } = await admin
    .from('marketplace_webhook_events')
    .insert({
      provider: providerCode,
      event_id: parsed.eventId,
      event_type: parsed.eventType,
      signature_valid: valid,
      status: valid ? 'received' : 'rejected',
      payload,
    })
    .select('id')
    .maybeSingle();

  if (logErr) {
    // Unique violation => replay of an event we already handled.
    if ((logErr as any).code === '23505') return json({ success: true, duplicate: true });
    return json({ error: 'could not record event' }, 500);
  }

  if (!valid) return json({ error: 'invalid signature' }, 401);

  const finish = async (status: string, error?: string) => {
    await admin
      .from('marketplace_webhook_events')
      .update({ status, error: error ?? null, processed_at: new Date().toISOString() })
      .eq('id', logged!.id);
  };

  if (parsed.outcome === 'ignored') {
    await finish('processed');
    return json({ success: true, ignored: true });
  }

  if (!parsed.attemptId) {
    await finish('error', 'missing attempt id');
    return json({ error: 'missing attempt reference' }, 400);
  }

  if (parsed.outcome === 'succeeded') {
    const { data, error } = await admin.rpc('mp_confirm_payment', {
      _provider: providerCode,
      _provider_txn_id: parsed.providerTxnId || parsed.eventId,
      _attempt_id: parsed.attemptId,
      _amount_minor: parsed.amountMinor,
      _currency: parsed.currency,
      _processor_fee_minor: Math.max(0, Math.round(parsed.processorFeeMinor || 0)),
      _raw: payload,
    });
    if (error) {
      await finish('error', error.message);
      return json({ error: error.message }, 400);
    }
    await finish('processed');
    return json({ success: true, result: data });
  }

  const { error } = await admin.rpc('mp_fail_payment', {
    _attempt_id: parsed.attemptId,
    _status: parsed.outcome === 'cancelled' ? 'cancelled' : 'failed',
    _error_code: parsed.eventType,
    _error_message: String(payload?.message || payload?.error || '').slice(0, 500) || null,
  });
  if (error) {
    await finish('error', error.message);
    return json({ error: error.message }, 400);
  }
  await finish('processed');
  return json({ success: true });
});
