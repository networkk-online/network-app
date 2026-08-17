import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney, effectivePrice } from '@/lib/marketplace';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trash2, Package, ShoppingCart } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate('/login'); return; }
    const { data } = await supabase
      .from('marketplace_carts')
      .select('*, product:marketplace_products(*, store:marketplace_stores(id,name,slug)), variant:marketplace_product_variants(id,label,price_delta,stock)')
      .eq('user_id', u.user.id)
      .order('created_at', { ascending: false });
    setItems((data || []).filter((r: any) => r.product));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setQty = async (id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    await supabase.from('marketplace_carts').update({ quantity: qty }).eq('id', id);
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('marketplace_carts').delete().eq('id', id);
  };

  const groups = useMemo(() => {
    const map = new Map<string, { store: any; rows: any[] }>();
    items.forEach((i) => {
      const s = i.product.store;
      const key = s?.id || 'unknown';
      if (!map.has(key)) map.set(key, { store: s, rows: [] });
      map.get(key)!.rows.push(i);
    });
    return Array.from(map.values());
  }, [items]);

  const subtotal = items.reduce(
    (sum, i) => sum + (effectivePrice(i.product) + Number(i.variant?.price_delta || 0)) * i.quantity,
    0,
  );
  const shipping = groups.reduce(
    (sum, g) => sum + Math.max(0, ...g.rows.map((r: any) => Number(r.product.shipping_fee || 0))),
    0,
  );

  return (
    <div className="min-h-screen bg-black text-white pb-40" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-base font-bold">سلة التسوق</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {loading && <p className="text-center text-white/40 text-sm py-12">جاري التحميل...</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <ShoppingCart className="w-12 h-12 mx-auto text-white/15" />
            <p className="text-white/50 text-sm">سلتك فارغة</p>
            <Button onClick={() => navigate('/marketplace')} className="bg-primary text-black rounded-xl">تصفح السوق</Button>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.store?.id} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] text-xs text-white/60">{g.store?.name}</div>
            {g.rows.map((i: any) => (
              <div key={i.id} className="p-3 flex gap-3 border-b border-white/[0.04] last:border-0">
                <Link to={`/product/${i.product.id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-white/[0.05] shrink-0">
                  {i.product.image_url ? <img src={i.product.image_url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-white/20" /></div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{i.product.name}</p>
                  {i.variant && <p className="text-[11px] text-white/40 mt-0.5">{i.variant.label}</p>}
                  <p className="text-primary font-bold text-sm mt-1">
                    {formatMoney((effectivePrice(i.product) + Number(i.variant?.price_delta || 0)) * i.quantity, i.product.currency)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center rounded-lg bg-white/[0.06] border border-white/[0.08]">
                      <button onClick={() => setQty(i.id, i.quantity - 1)} className="w-9 h-9">-</button>
                      <span className="w-7 text-center text-xs">{i.quantity}</span>
                      <button onClick={() => setQty(i.id, Math.min(i.quantity + 1, i.product.stock))} className="w-9 h-9">+</button>
                    </div>
                    <button onClick={() => remove(i.id)} className="w-9 h-9 flex items-center justify-center text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/[0.08] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex justify-between text-xs text-white/50"><span>المجموع الفرعي</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between text-xs text-white/50"><span>الشحن التقديري</span><span>{formatMoney(shipping)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span>الإجمالي</span><span className="text-primary">{formatMoney(subtotal + shipping)}</span></div>
            <p className="text-[10px] text-white/30">يتم احتساب الإجمالي النهائي على الخادم عند تأكيد الطلب.</p>
            <Button onClick={() => navigate('/checkout')} className="w-full h-12 rounded-xl bg-primary text-black font-bold">متابعة الشراء</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
