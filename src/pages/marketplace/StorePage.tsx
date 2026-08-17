import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney, effectivePrice, categoryLabel } from '@/lib/marketplace';
import { ArrowRight, BadgeCheck, Star, MapPin, Phone, Package, Store as StoreIcon, ShoppingBag } from 'lucide-react';

const StorePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!username) return;
      setLoading(true);
      const { data } = await supabase.from('marketplace_stores').select('*').eq('slug', username).maybeSingle();
      setStore(data);
      if (data) {
        const { data: p } = await supabase
          .from('marketplace_products').select('*')
          .eq('store_id', data.id).eq('status', 'published')
          .order('created_at', { ascending: false }).limit(60);
        setProducts(p || []);
      }
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!store) return <div className="min-h-screen bg-black text-white/60 flex items-center justify-center">المتجر غير متاح</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-28" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-sm font-bold truncate">{store.name}</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="h-36 sm:h-52 bg-white/[0.04] overflow-hidden">
          {store.cover_url && <img src={store.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>

        <div className="px-4 -mt-10 relative">
          <div className="w-24 h-24 rounded-[28%] overflow-hidden border-2 border-black bg-white/[0.06]">
            {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><StoreIcon className="w-8 h-8 text-white/20" /></div>}
          </div>

          <div className="mt-3 space-y-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {store.name}
              {store.is_verified && <BadgeCheck className="w-5 h-5 text-primary" />}
            </h2>
            <p className="text-xs text-white/40">@{store.slug} · {categoryLabel(store.category)}</p>
            {store.description && <p className="text-sm text-white/70 leading-relaxed">{store.description}</p>}
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 pt-1">
              {store.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{store.location}</span>}
              {store.contact_phone && <a href={`tel:${store.contact_phone}`} className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{store.contact_phone}</a>}
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" />{Number(store.rating || 0).toFixed(1)} ({store.reviews_count})</span>
              <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" />{store.orders_count} طلب مكتمل</span>
            </div>
          </div>
        </div>

        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold mb-3">المنتجات ({products.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
                <div className="aspect-square bg-white/[0.03]">
                  {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-7 h-7" /></div>}
                </div>
                <div className="p-3">
                  <p className="text-[13px] line-clamp-2">{p.name}</p>
                  <p className="text-primary font-bold text-sm mt-1">{formatMoney(effectivePrice(p), p.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
          {products.length === 0 && <p className="text-center text-white/40 text-sm py-12">لا توجد منتجات منشورة</p>}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
