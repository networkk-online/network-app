// Creates a payment attempt for a marketplace order and, when a real provider
// is configured, opens a hosted-checkout session with it.
// This function NEVER marks an order as paid — only the signed webhook can.
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }

  const orderId = typeof body?.order_id === 'string' ? body.order_id.trim() : '';
  const returnUrl = typeof body?.return_url === 'string' ? body.return_url.slice(0, 500) : '';
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(orderId)) return json({ error: { order_id: ['must be a valid order id'] } }, 400);

  // Server creates/reuses the attempt with authoritative amounts.
  const { data: attempt, error: attemptErr } = await userClient.rpc('mp_create_payment_attempt', {
    _order_id: orderId,
    _idempotency_key: null,
  });
  if (attemptErr) return json({ error: attemptErr.message }, 400);

  const a: any = attempt;
  const providerCode = String(a?.provider || 'none');
  const adapter = getProvider(providerCode);

  if (!adapter || providerCode === 'none') {
    return json({
      success: true,
      attempt_id: a?.attempt_id,
      provider: providerCode,
      environment: a?.environment,
      amount_minor: a?.amount_minor,
      currency: a?.currency,
      requires_redirect: false,
      instruction: 'manual_confirmation',
    });
  }

  let session;
  try {
    session = await adapter.createSession({
      attemptId: String(a.attempt_id),
      orderId,
      amountMinor: Number(a.amount_minor),
      currency: String(a.currency || 'IQD'),
      environment: (a.environment === 'live' ? 'live' : 'test'),
      idempotencyKey: String(a.idempotency_key || a.attempt_id),
      returnUrl,
    });
  } catch (e) {
    return json({ error: `provider session failed: ${(e as Error).message}` }, 502);
  }

  if (session.checkoutUrl || session.providerRef) {
    const admin = createClient(supabaseUrl, serviceKey);
    await admin
      .from('marketplace_payment_attempts')
      .update({
        status: 'pending',
        checkout_url: session.checkoutUrl,
        provider_ref: session.providerRef,
        updated_at: new Date().toISOString(),
      })
      .eq('id', a.attempt_id);
  }

  return json({
    success: true,
    attempt_id: a.attempt_id,
    provider: providerCode,
    environment: a.environment,
    amount_minor: a.amount_minor,
    currency: a.currency,
    checkout_url: session.checkoutUrl,
    requires_redirect: session.requiresRedirect,
    instruction: session.instruction ?? null,
  });
});
