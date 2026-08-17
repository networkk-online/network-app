import { supabase } from '@/integrations/supabase/client';

export const MP_CATEGORIES = [
  { id: 'fashion', ar: 'أزياء', en: 'Fashion' },
  { id: 'electronics', ar: 'إلكترونيات', en: 'Electronics' },
  { id: 'beauty', ar: 'جمال والعناية', en: 'Beauty' },
  { id: 'home', ar: 'منزل ومطبخ', en: 'Home' },
  { id: 'sports', ar: 'رياضة', en: 'Sports' },
  { id: 'kids', ar: 'أطفال', en: 'Kids' },
  { id: 'food', ar: 'أطعمة', en: 'Food' },
  { id: 'digital', ar: 'منتجات رقمية', en: 'Digital' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
];

export const categoryLabel = (id?: string | null) =>
  MP_CATEGORIES.find((c) => c.id === id)?.ar || id || '—';

export const formatMoney = (v: number | string | null | undefined, currency = 'IQD') => {
  const n = Number(v || 0);
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
};

export const effectivePrice = (p: { price: number; discount_price?: number | null }) =>
  p.discount_price && Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.price);

export const ORDER_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  payment_pending: 'بانتظار الدفع',
  paid: 'مدفوع',
  confirmed: 'مؤكد',
  preparing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترجع',
  disputed: 'نزاع',
};

export const STORE_STATUS_AR: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'مفعّل',
  rejected: 'مرفوض',
  suspended: 'موقوف',
  disabled: 'معطل',
};

export const PRODUCT_STATUS_AR: Record<string, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  published: 'منشور',
  rejected: 'مرفوض',
  out_of_stock: 'نفد المخزون',
  suspended: 'موقوف',
};

export const PAYOUT_STATUS_AR: Record<string, string> = {
  requested: 'مقدم',
  under_review: 'قيد المراجعة',
  approved: 'موافق عليه',
  processing: 'قيد المعالجة',
  paid: 'مدفوع',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
};

/** Uploads marketplace media into the shared public media bucket under the user's folder. */
export async function uploadMarketplaceMedia(file: File, uid: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${uid}/marketplace/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('post-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl;
}

export async function addToCart(productId: string, quantity = 1, variantId?: string | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error('auth');
  const { data: existing } = await supabase
    .from('marketplace_carts')
    .select('id, quantity')
    .eq('user_id', u.user.id)
    .eq('product_id', productId)
    .is('variant_id', variantId ? (undefined as any) : null)
    .maybeSingle();

  if (existing && !variantId) {
    const { error } = await supabase
      .from('marketplace_carts')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('marketplace_carts').insert({
    user_id: u.user.id,
    product_id: productId,
    variant_id: variantId || null,
    quantity,
  });
  if (error) throw error;
}
