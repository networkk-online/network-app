// Payment provider abstraction for the Networkk Marketplace (real money, IQD).
// Each provider adapter turns an internal payment attempt into an external
// hosted-checkout session. Confirmation NEVER happens here — only the
// signed webhook (marketplace-webhook) may mark an order as paid.

export interface AttemptContext {
  attemptId: string;
  orderId: string;
  orderNumber?: string | null;
  amountMinor: number;
  currency: string;
  environment: 'test' | 'live';
  idempotencyKey: string;
  returnUrl: string;
  buyerName?: string | null;
  buyerPhone?: string | null;
}

export interface SessionResult {
  /** Hosted checkout URL the buyer is redirected to, when the provider has one. */
  checkoutUrl: string | null;
  /** Provider-side reference for this attempt, when known upfront. */
  providerRef: string | null;
  /** Human instruction shown when there is no redirect (e.g. cash on delivery). */
  instruction?: string;
  /** True when the buyer must complete an off-app step before confirmation. */
  requiresRedirect: boolean;
}

export interface ProviderAdapter {
  code: string;
  createSession(ctx: AttemptContext): Promise<SessionResult>;
  /** HMAC/secret verification of an inbound webhook. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<boolean>;
  /** Normalises a provider payload into our internal confirmation shape. */
  parseEvent(payload: any): {
    eventId: string;
    eventType: string;
    attemptId: string | null;
    providerTxnId: string | null;
    amountMinor: number | null;
    currency: string | null;
    processorFeeMinor: number;
    outcome: 'succeeded' | 'failed' | 'cancelled' | 'ignored';
  };
}

const enc = new TextEncoder();

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * Generic HMAC-signed provider. Works with any licensed local processor that
 * can POST a JSON webhook signed with a shared secret in `x-mp-signature`.
 * Configure MARKETPLACE_PAYMENT_BASE_URL + MARKETPLACE_WEBHOOK_SECRET.
 */
const hmacProvider = (code: string): ProviderAdapter => ({
  code,
  async createSession(ctx) {
    const base = Deno.env.get('MARKETPLACE_PAYMENT_BASE_URL');
    if (!base) {
      return {
        checkoutUrl: null,
        providerRef: null,
        requiresRedirect: false,
        instruction: 'provider_not_configured',
      };
    }
    const url = new URL(base);
    url.searchParams.set('reference', ctx.idempotencyKey);
    url.searchParams.set('amount', String(ctx.amountMinor));
    url.searchParams.set('currency', ctx.currency);
    url.searchParams.set('attempt', ctx.attemptId);
    url.searchParams.set('env', ctx.environment);
    url.searchParams.set('return_url', ctx.returnUrl);
    return {
      checkoutUrl: url.toString(),
      providerRef: null,
      requiresRedirect: true,
    };
  },
  async verifyWebhook(rawBody, headers) {
    const secret = Deno.env.get('MARKETPLACE_WEBHOOK_SECRET');
    if (!secret) return false;
    const provided = headers.get('x-mp-signature') || '';
    if (!provided) return false;
    const expected = await hmacHex(secret, rawBody);
    return timingSafeEqual(provided.replace(/^sha256=/, '').toLowerCase(), expected);
  },
  parseEvent(payload) {
    const status = String(payload?.status || payload?.event || '').toLowerCase();
    const outcome = status.includes('success') || status === 'paid' || status === 'captured'
      ? 'succeeded'
      : status.includes('cancel')
        ? 'cancelled'
        : status.includes('fail') || status.includes('declin')
          ? 'failed'
          : 'ignored';
    return {
      eventId: String(payload?.event_id || payload?.id || crypto.randomUUID()),
      eventType: status || 'unknown',
      attemptId: payload?.attempt_id ?? payload?.metadata?.attempt_id ?? null,
      providerTxnId: payload?.transaction_id ?? payload?.txn_id ?? payload?.id ?? null,
      amountMinor: payload?.amount != null ? Number(payload.amount) : null,
      currency: payload?.currency ?? null,
      processorFeeMinor: Number(payload?.fee ?? payload?.processor_fee ?? 0),
      outcome: outcome as any,
    };
  },
});

/** Manual / cash-on-delivery: no external session, admin confirms later. */
const manualProvider: ProviderAdapter = {
  code: 'manual',
  async createSession() {
    return {
      checkoutUrl: null,
      providerRef: null,
      requiresRedirect: false,
      instruction: 'manual_confirmation',
    };
  },
  async verifyWebhook() {
    return false;
  },
  parseEvent() {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'manual',
      attemptId: null,
      providerTxnId: null,
      amountMinor: null,
      currency: null,
      processorFeeMinor: 0,
      outcome: 'ignored',
    };
  },
};

const registry: Record<string, ProviderAdapter> = {
  manual: manualProvider,
  gateway: hmacProvider('gateway'),
  zaincash: hmacProvider('zaincash'),
  qicard: hmacProvider('qicard'),
  fib: hmacProvider('fib'),
};

export function getProvider(code: string): ProviderAdapter | null {
  return registry[code] ?? null;
}

export function listProviderCodes(): string[] {
  return Object.keys(registry);
}
