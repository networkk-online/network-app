import { supabase } from '@/integrations/supabase/client';

/**
 * Marketplace real-money helpers (IQD).
 *
 * IMPORTANT: Marketplace money and R Coin are two separate systems.
 * Nothing here touches gem/R Coin balances and there is no conversion
 * between them in either direction.
 */

export type PaymentEnvironment = 'test' | 'live';

export interface PaymentConfig {
  environment: PaymentEnvironment;
  provider: string;
  min_payout: number;
  provider_ready: boolean;
}

export interface CheckoutQuoteStore {
  store_id: string;
  subtotal: number;
  shipping: number;
  total: number;
  commission_rate: number;
  commission_amount: number;
  merchant_entitlement: number;
  currency: string;
}

export interface CheckoutQuote {
  stores: CheckoutQuoteStore[];
  grand_total: number;
  currency: string;
}

export interface PaymentSession {
  attempt_id: string;
  provider: string;
  environment: PaymentEnvironment;
  amount_minor: number;
  currency: string;
  checkout_url?: string | null;
  requires_redirect: boolean;
  instruction?: string | null;
}

export const PAYMENT_STATUS_AR: Record<string, string> = {
  pending: 'بانتظار الدفع',
  created: 'بانتظار الدفع',
  paid: 'مدفوع',
  succeeded: 'مدفوع',
  failed: 'فشل الدفع',
  cancelled: 'ملغي',
  expired: 'منتهي الصلاحية',
  refunded: 'مسترجع',
};

export const PAYOUT_STATE_AR: Record<string, string> = {
  verification_pending: 'بانتظار توثيق النشاط التجاري',
  verified: 'تم التوثيق — بانتظار تفعيل السحب',
  payout_enabled: 'السحب مفعّل',
  payout_suspended: 'السحب موقوف',
};

/** Server-authoritative pricing preview. Client prices are never trusted. */
export async function fetchCheckoutQuote(
  items: { product_id: string; variant_id?: string | null; quantity: number }[],
): Promise<CheckoutQuote> {
  const { data, error } = await supabase.rpc('mp_quote_checkout', { _items: items as any });
  if (error) throw error;
  const d: any = data;
  return {
    stores: (d?.stores || []) as CheckoutQuoteStore[],
    grand_total: Number(d?.grand_total || 0),
    currency: d?.currency || 'IQD',
  };
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const { data, error } = await supabase.rpc('mp_payment_config');
  if (error) throw error;
  const d: any = data || {};
  return {
    environment: d.environment === 'live' ? 'live' : 'test',
    provider: d.provider || 'none',
    min_payout: Number(d.min_payout || 0),
    provider_ready: Boolean(d.provider_ready),
  };
}

/**
 * Starts a payment for an order through the payment edge function.
 * The response never confirms the payment — confirmation arrives from the
 * provider webhook and is written server-side.
 */
export async function startPayment(orderId: string): Promise<PaymentSession> {
  const { data, error } = await supabase.functions.invoke('marketplace-payment', {
    body: { order_id: orderId, return_url: `${window.location.origin}/orders` },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return data as PaymentSession;
}

/** Reads the live payment state of an order (buyer-visible, read-only). */
export async function fetchOrderPaymentState(orderId: string) {
  const [{ data: attempts }, { data: txns }] = await Promise.all([
    supabase
      .from('marketplace_payment_attempts')
      .select('id,status,provider,amount_minor,currency,checkout_url,created_at,error_message')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('marketplace_payment_transactions')
      .select('id,kind,status,gross_amount_minor,currency,provider,confirmed_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);
  return { attempts: attempts || [], transactions: txns || [] };
}

export function minorToAmount(minor: number | string | null | undefined, currency = 'IQD') {
  const factor = ['IQD', 'JPY', 'KRW'].includes(currency.toUpperCase()) ? 1 : 100;
  return Number(minor || 0) / factor;
}
