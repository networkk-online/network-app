import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MP_CATEGORIES, categoryLabel, formatMoney, effectivePrice } from '@/lib/marketplace';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart, Store, BadgeCheck, Star, SlidersHorizontal, Package } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';

type Row = any;

const SORTS = [
  { id: 'new', label: 'الأحدث' },
  { id: 'best', label: 'الأكثر مبيعاً' },
  { id: 'price_asc', label: 'السعر: الأقل' },
  { id: 'price_desc', label: 'السعر: الأعلى' },
  { id: 'rating', label: 'الأعلى تقييماً' },
];

const PAGE = 18;

const ProductCard = ({ p }: { p: Row }) => (
  <Link
    to={`/product/${p.id}`}
    className="group rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl hover:border-primary/40 transition-colors"
  >
    <div className="aspect-square bg-white/[0.03] overflow-hidden">
      {p.image_url ? (
        <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-8 h-8" /></div>
      )}
    </div>
    <div className="p-3 space-y-1.5">
      <p className="text-[13px] text-white/90 line-clamp-2 leading-snug">{p.name}</p>
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold text-sm">{formatMoney(effectivePrice(p), p.currency)}</span>
        {p.discount_price > 0 && (
          <span className="text-[11px] text-white/30 line-through">{formatMoney(p.price, p.currency)}</span>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/40">
        <span className="flex items-center gap-1 truncate">
          {p.store?.is_verified && <BadgeCheck className="w-3 h-3 text-primary shrink-0" />}
          <span className="truncate">{p.store?.name}</span>
        </span>
        {p.rating > 0 && (
          <span className="flex items-center gap-0.5 shrink-0"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(p.rating).toFixed(1)}</span>
        )}
      </div>
    </div>
  </Link>
);

const Marketplace = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Row[]>([]);
  const [stores, setStores] = useState<Row[]>([]);
  const [featured, setFeatured] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('new');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const buildQuery = useCallback((pageIndex: number) => {
    let query = supabase
      .from('marketplace_products')
      .select('*, store:marketplace_stores!inner(id,name,slug,logo_url,is_verified,status,rating)')
      .eq('status', 'published')
      .eq('store.status', 'approved')
      .range(pageIndex * PAGE, pageIndex * PAGE + PAGE - 1);

    if (q.trim()) query = query.ilike('name', `%${q.trim()}%`);
    if (category) query = query.eq('category', category);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    if (sort === 'new') query = query.order('created_at', { ascending: false });
    if (sort === 'best') query = query.order('sales_count', { ascending: false });
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    if (sort === 'price_desc') query = query.order('price', { ascending: false });
    if (sort === 'rating') query = query.order('rating', { ascending: false });
    return query;
  }, [q, category, sort, minPrice, maxPrice]);

  const load = useCallback(async (reset = false) => {
    const idx = reset ? 0 : page;
    setLoading(true);
    const { data } = await buildQuery(idx);
    const rows = data || [];
    setProducts((prev) => (reset ? rows : [...prev, ...rows]));
    setMore(rows.length === PAGE);
    setPage(idx + 1);
    setLoading(false);
  }, [buildQuery, page]);

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [q, category, sort, minPrice, maxPrice]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: f }, { data: u }] = await Promise.all([
        supabase.from('marketplace_stores').select('id,name,slug,logo_url,is_verified,rating,category')
          .eq('status', 'approved').order('rating', { ascending: false }).limit(12),
        supabase.from('marketplace_products')
          .select('*, store:marketplace_stores!inner(id,name,slug,is_verified,status)')
          .eq('status', 'published').eq('is_featured', true).eq('store.status', 'approved').limit(8),
        supabase.auth.getUser(),
      ]);
      setStores(s || []);
      setFeatured(f || []);
      if (u.user) {
        const { count } = await supabase.from('marketplace_carts').select('id', { count: 'exact', head: true }).eq('user_id', u.user.id);
        setCartCount(count || 0);
      }
    })();
  }, []);

  const grid = useMemo(() => products, [products]);

  return (
    <div className="min-h-screen bg-black text-white pb-28" dir="rtl">
      <SeoHead title="سوق Networkk | تسوّق من المتاجر الموثوقة" description="سوق Networkk — منتجات من متاجر الأعمال الموثوقة داخل التطبيق مع دفع آمن وتوصيل." />

      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-bold shrink-0">السوق</h1>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="pr-9 bg-white/[0.05] border-white/[0.08] h-11 rounded-xl"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 min-h-[44px] min-w-[44px]" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative shrink-0 min-h-[44px] min-w-[44px]" onClick={() => navigate('/cart')}>
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-primary text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>
            )}
          </Button>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button onClick={() => setCategory(null)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${!category ? 'bg-primary text-black border-primary' : 'bg-white/[0.05] border-white/[0.08] text-white/70'}`}>الكل</button>
          {MP_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${category === c.id ? 'bg-primary text-black border-primary' : 'bg-white/[0.05] border-white/[0.08] text-white/70'}`}>{c.ar}</button>
          ))}
        </div>

        {showFilters && (
          <div className="max-w-6xl mx-auto px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="numeric" placeholder="أقل سعر" className="bg-white/[0.05] border-white/[0.08] h-10 rounded-xl" />
            <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="numeric" placeholder="أعلى سعر" className="bg-white/[0.05] border-white/[0.08] h-10 rounded-xl" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="col-span-2 sm:col-span-2 bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-3 text-sm">
              {SORTS.map((s) => <option key={s.id} value={s.id} className="bg-black">{s.label}</option>)}
            </select>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-8">
        {stores.length > 0 && (
          <section>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> متاجر موثوقة</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
              {stores.map((s) => (
                <Link key={s.id} to={`/store/${s.slug}`} className="shrink-0 w-24 text-center">
                  <div className="w-20 h-20 mx-auto rounded-[28%] overflow-hidden bg-white/[0.05] border border-white/[0.08]">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store className="w-6 h-6 text-white/20" /></div>}
                  </div>
                  <p className="text-[11px] mt-1.5 truncate flex items-center justify-center gap-1">
                    {s.is_verified && <BadgeCheck className="w-3 h-3 text-primary" />}<span className="truncate">{s.name}</span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && !q && !category && (
          <section>
            <h2 className="text-sm font-bold mb-3">منتجات مميزة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold mb-3">{category ? categoryLabel(category) : 'كل المنتجات'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {grid.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {!loading && grid.length === 0 && (
            <div className="text-center py-16 text-white/40 text-sm">لا توجد منتجات مطابقة</div>
          )}
          {loading && <div className="text-center py-8 text-white/40 text-sm">جاري التحميل...</div>}
          {more && !loading && grid.length > 0 && (
            <div className="text-center pt-6">
              <Button variant="outline" className="rounded-xl border-white/10" onClick={() => load(false)}>عرض المزيد</Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Marketplace;
