import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { addToCart, formatMoney, effectivePrice, categoryLabel } from '@/lib/marketplace';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight, BadgeCheck, Star, Truck, ShieldCheck, Heart, Share2, Flag, Package, Store,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data } = await supabase
        .from('marketplace_products')
        .select('*, store:marketplace_stores(id,name,slug,logo_url,is_verified,rating,location,contact_phone,status)')
        .eq('id', id)
        .maybeSingle();
      setProduct(data);
      if (data) {
        const [{ data: v }, { data: r }, { data: u }] = await Promise.all([
          supabase.from('marketplace_product_variants').select('*').eq('product_id', id),
          supabase.from('marketplace_reviews').select('*').eq('product_id', id).eq('is_hidden', false).order('created_at', { ascending: false }).limit(20),
          supabase.auth.getUser(),
        ]);
        setVariants(v || []);
        setReviews(r || []);
        if (u.user) {
          const { data: s } = await supabase.from('marketplace_saved_products').select('id').eq('user_id', u.user.id).eq('product_id', id).maybeSingle();
          setSaved(!!s);
        }
        supabase.from('marketplace_products').update({ views_count: (data.views_count || 0) + 1 }).eq('id', id).then(() => {});
      }
      setLoading(false);
    })();
  }, [id]);

  const images: string[] = product
    ? [product.image_url, ...((Array.isArray(product.images) ? product.images : []) as string[])].filter(Boolean)
    : [];

  const unitPrice = product
    ? effectivePrice(product) + Number(variants.find((v) => v.id === variantId)?.price_delta || 0)
    : 0;

  const requireAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { navigate('/login'); return null; }
    return data.user;
  };

  const handleAdd = async (buyNow = false) => {
    if (!(await requireAuth())) return;
    if (variants.length > 0 && !variantId) { toast({ title: 'اختر الخيار المطلوب', variant: 'destructive' }); return; }
    setBusy(true);
    try {
      await addToCart(product.id, qty, variantId);
      toast({ title: 'تمت الإضافة إلى السلة' });
      if (buyNow) navigate('/cart');
    } catch (e: any) {
      toast({ title: 'تعذر الإضافة', description: e.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  const toggleSave = async () => {
    const u = await requireAuth();
    if (!u) return;
    if (saved) {
      await supabase.from('marketplace_saved_products').delete().eq('user_id', u.id).eq('product_id', product.id);
      setSaved(false);
    } else {
      await supabase.from('marketplace_saved_products').insert({ user_id: u.id, product_id: product.id });
      setSaved(true);
    }
  };

  const submitReport = async () => {
    const u = await requireAuth();
    if (!u) return;
    await supabase.from('marketplace_reports').insert({
      reporter_id: u.id, target_type: 'product', target_id: product.id, reason: 'product_report', details: reportText,
    });
    setReportOpen(false); setReportText('');
    toast({ title: 'تم إرسال البلاغ' });
  };

  const share = async () => {
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) { try { await navigator.share({ title: product.name, url }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url);
    toast({ title: 'تم نسخ الرابط' });
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen bg-black text-white/60 flex items-center justify-center">المنتج غير متاح</div>;

  const outOfStock = product.stock <= 0 || product.status !== 'published';

  return (
    <div className="min-h-screen bg-black text-white pb-32" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-sm font-bold truncate flex-1">{product.name}</h1>
          <button onClick={share} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><Share2 className="w-5 h-5" /></button>
          <button onClick={toggleSave} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Heart className={`w-5 h-5 ${saved ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] aspect-square max-h-[520px]">
          {product.video_url && active === -1 ? (
            <video src={product.video_url} controls playsInline className="w-full h-full object-contain bg-black" />
          ) : images[active] ? (
            <img src={images[active]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-12 h-12" /></div>
          )}
        </div>

        {(images.length > 1 || product.video_url) && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {product.video_url && (
              <button onClick={() => setActive(-1)} className={`w-16 h-16 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center text-[10px] ${active === -1 ? 'border-primary' : 'border-white/10'}`}>فيديو</button>
            )}
            {images.map((img, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-16 h-16 rounded-xl overflow-hidden border shrink-0 ${active === i ? 'border-primary' : 'border-white/10'}`}>
                <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-lg font-bold leading-snug">{product.name}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl font-bold text-primary">{formatMoney(unitPrice, product.currency)}</span>
            {product.discount_price > 0 && <span className="text-sm text-white/30 line-through">{formatMoney(product.price, product.currency)}</span>}
            {product.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" />{Number(product.rating).toFixed(1)} ({product.reviews_count})</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>{categoryLabel(product.category)}</span>
            <span>{outOfStock ? 'غير متوفر' : `المتوفر: ${product.stock}`}</span>
            {product.sku && <span>SKU: {product.sku}</span>}
          </div>
        </div>

        {variants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/50">الخيارات</p>
            <div className="flex gap-2 flex-wrap">
              {variants.map((v) => (
                <button key={v.id} onClick={() => setVariantId(v.id)} disabled={v.stock <= 0}
                  className={`px-3 py-2 rounded-xl text-xs border min-h-[44px] ${variantId === v.id ? 'bg-primary text-black border-primary' : 'bg-white/[0.05] border-white/[0.08]'} disabled:opacity-30`}>
                  {v.label}{Number(v.price_delta) ? ` (+${formatMoney(v.price_delta, product.currency)})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.store && (
          <Link to={`/store/${product.store.slug}`} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-12 h-12 rounded-[28%] overflow-hidden bg-white/[0.05] shrink-0">
              {product.store.logo_url ? <img src={product.store.logo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store className="w-5 h-5 text-white/20" /></div>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold flex items-center gap-1 truncate">
                {product.store.name}{product.store.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
              </p>
              <p className="text-[11px] text-white/40 truncate">{product.store.location || 'متجر على Networkk'}</p>
            </div>
            <span className="text-xs text-primary">زيارة المتجر</span>
          </Link>
        )}

        {product.description && (
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-2">الوصف</p>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{product.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 text-xs text-white/60">
            <Truck className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">{product.shipping_info || 'الشحن حسب المتجر'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>حماية المشتري</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold mb-2">التقييمات ({reviews.length})</p>
          {reviews.length === 0 ? (
            <p className="text-xs text-white/40">لا توجد تقييمات بعد</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="flex items-center gap-1 text-amber-400 mb-1">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400" />)}
                  </div>
                  {r.body && <p className="text-sm text-white/70">{r.body}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setReportOpen(true)} className="flex items-center gap-2 text-xs text-white/40 min-h-[44px]">
          <Flag className="w-3.5 h-3.5" /> الإبلاغ عن هذا المنتج
        </button>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/[0.08] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11">-</button>
            <span className="w-8 text-center text-sm">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-11 h-11">+</button>
          </div>
          <Button disabled={outOfStock || busy} onClick={() => handleAdd(false)} variant="outline" className="flex-1 h-12 rounded-xl border-white/15">أضف للسلة</Button>
          <Button disabled={outOfStock || busy} onClick={() => handleAdd(true)} className="flex-1 h-12 rounded-xl bg-primary text-black font-bold">شراء الآن</Button>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="bg-black border-white/10" dir="rtl">
          <DialogHeader><DialogTitle>الإبلاغ عن المنتج</DialogTitle></DialogHeader>
          <Textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="اذكر سبب البلاغ" className="bg-white/[0.05] border-white/[0.08]" />
          <DialogFooter><Button onClick={submitReport} className="bg-primary text-black">إرسال</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductPage;
