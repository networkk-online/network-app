import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  MP_CATEGORIES, formatMoney, uploadMarketplaceMedia, STORE_STATUS_AR, PRODUCT_STATUS_AR,
  PAYOUT_STATUS_AR, ORDER_STATUS_AR, effectivePrice,
} from '@/lib/marketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowRight, Store, Package, ShoppingBag, Wallet, Plus, Trash2, Copy, Image as ImageIcon, BarChart3,
} from 'lucide-react';

const TABS = [
  { id: 'store', label: 'المتجر', icon: Store },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
  { id: 'balance', label: 'الرصيد', icon: Wallet },
  { id: 'payouts', label: 'السحوبات', icon: BarChart3 },
];

const emptyProduct = {
  name: '', description: '', category: 'other', price: '', discount_price: '', stock: '0',
  sku: '', weight: '', shipping_info: '', shipping_fee: '0', image_url: '', video_url: '', status: 'pending',
};

const BusinessStore = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const [tab, setTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<any>({ name: '', slug: '', description: '', category: 'other', location: '', contact_phone: '', contact_whatsapp: '', logo_url: '', cover_url: '' });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pForm, setPForm] = useState<any>(emptyProduct);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutDest, setPayoutDest] = useState('');

  const loadStoreData = useCallback(async (storeId: string) => {
    const [{ data: p }, { data: o }, { data: po }, { data: b }] = await Promise.all([
      supabase.from('marketplace_products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('marketplace_orders').select('*, items:marketplace_order_items(*)').eq('store_id', storeId).order('created_at', { ascending: false }).limit(50),
      supabase.from('marketplace_payouts').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.rpc('mp_store_balances', { _store_id: storeId }),
    ]);
    setProducts(p || []); setOrders(o || []); setPayouts(po || []); setBalances(b || null);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate('/login'); return; }
      setUid(u.user.id);
      const { data: s } = await supabase.from('marketplace_stores').select('*').eq('owner_id', u.user.id).maybeSingle();
      if (s) {
        setStore(s);
        setForm({
          name: s.name, slug: s.slug, description: s.description || '', category: s.category || 'other',
          location: s.location || '', contact_phone: s.contact_phone || '', contact_whatsapp: s.contact_whatsapp || '',
          logo_url: s.logo_url || '', cover_url: s.cover_url || '',
        });
        await loadStoreData(s.id);
      } else {
        const { data: prof } = await supabase.rpc('get_own_profile');
        const pr: any = Array.isArray(prof) ? prof[0] : prof;
        if (pr) setForm((f: any) => ({ ...f, name: pr.full_name || pr.username || '', slug: pr.username || '' }));
      }
      setLoading(false);
    })();
  }, [navigate, loadStoreData]);

  const upload = async (file: File, field: string, target: 'store' | 'product') => {
    if (!uid) return;
    try {
      const url = await uploadMarketplaceMedia(file, uid);
      if (target === 'store') setForm((f: any) => ({ ...f, [field]: url }));
      else setPForm((f: any) => ({ ...f, [field]: url }));
    } catch (e: any) {
      toast({ title: 'تعذر رفع الملف', description: e.message, variant: 'destructive' });
    }
  };

  const saveStore = async () => {
    if (!uid) return;
    if (!form.name.trim() || !form.slug.trim()) { toast({ title: 'الاسم والمعرّف مطلوبان', variant: 'destructive' }); return; }
    setSaving(true);
    if (store) {
      const { error } = await supabase.from('marketplace_stores').update({
        name: form.name, description: form.description, category: form.category, location: form.location,
        contact_phone: form.contact_phone, contact_whatsapp: form.contact_whatsapp,
        logo_url: form.logo_url, cover_url: form.cover_url,
      }).eq('id', store.id);
      if (error) toast({ title: 'تعذر الحفظ', description: error.message, variant: 'destructive' });
      else toast({ title: 'تم حفظ بيانات المتجر' });
    } else {
      const { data, error } = await supabase.from('marketplace_stores').insert({
        owner_id: uid, name: form.name, slug: form.slug.trim().toLowerCase(), description: form.description,
        category: form.category, location: form.location, contact_phone: form.contact_phone,
        contact_whatsapp: form.contact_whatsapp, logo_url: form.logo_url, cover_url: form.cover_url,
        status: 'pending',
      }).select().maybeSingle();
      if (error) toast({ title: 'تعذر إنشاء المتجر', description: error.message, variant: 'destructive' });
      else { setStore(data); toast({ title: 'تم إرسال طلب تفعيل المتجر للمراجعة' }); }
    }
    setSaving(false);
  };

  const saveProduct = async () => {
    if (!store) return;
    if (store.status !== 'approved') { toast({ title: 'يجب تفعيل المتجر أولاً', variant: 'destructive' }); return; }
    const payload = {
      store_id: store.id,
      name: pForm.name,
      description: pForm.description,
      category: pForm.category,
      price: Number(pForm.price || 0),
      discount_price: pForm.discount_price ? Number(pForm.discount_price) : null,
      stock: Number(pForm.stock || 0),
      sku: pForm.sku || null,
      weight: pForm.weight ? Number(pForm.weight) : null,
      shipping_info: pForm.shipping_info || null,
      shipping_fee: Number(pForm.shipping_fee || 0),
      image_url: pForm.image_url || null,
      video_url: pForm.video_url || null,
      status: pForm.status,
    };
    if (!payload.name.trim() || payload.price <= 0) { toast({ title: 'الاسم والسعر مطلوبان', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = editing
      ? await supabase.from('marketplace_products').update(payload).eq('id', editing.id)
      : await supabase.from('marketplace_products').insert(payload);
    setSaving(false);
    if (error) { toast({ title: 'تعذر الحفظ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'تم تحديث المنتج' : 'تمت إضافة المنتج' });
    setProductDialog(false); setEditing(null); setPForm(emptyProduct);
    loadStoreData(store.id);
  };

  const duplicateProduct = async (p: any) => {
    const { id, created_at, updated_at, views_count, sales_count, rating, reviews_count, ...rest } = p;
    await supabase.from('marketplace_products').insert({ ...rest, name: `${p.name} (نسخة)`, status: 'draft' });
    toast({ title: 'تم نسخ المنتج' });
    loadStoreData(store.id);
  };

  const removeProduct = async (p: any) => {
    await supabase.from('marketplace_products').delete().eq('id', p.id);
    loadStoreData(store.id);
  };

  const setFulfilment = async (orderId: string, status: string) => {
    const { error } = await supabase.rpc('mp_set_fulfilment', { _order_id: orderId, _status: status, _tracking: null });
    if (error) toast({ title: 'تعذر التحديث', description: error.message, variant: 'destructive' });
    else { toast({ title: 'تم تحديث حالة الطلب' }); loadStoreData(store.id); }
  };

  const requestPayout = async () => {
    const { error } = await supabase.rpc('mp_request_payout', {
      _store_id: store.id, _amount: Number(payoutAmount || 0), _method: 'manual', _destination: payoutDest, _note: null,
    });
    if (error) toast({ title: 'تعذر طلب السحب', description: error.message, variant: 'destructive' });
    else { toast({ title: 'تم إرسال طلب السحب' }); setPayoutAmount(''); loadStoreData(store.id); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pb-28" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-base font-bold flex-1">متجري</h1>
          {store && <span className="text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary">{STORE_STATUS_AR[store.status]}</span>}
        </div>
        {store && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border min-h-[40px] flex items-center gap-1.5 ${tab === t.id ? 'bg-primary text-black border-primary' : 'bg-white/[0.05] border-white/[0.08] text-white/70'}`}>
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {(!store || tab === 'store') && (
          <section className="space-y-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <p className="text-sm font-bold">{store ? 'بيانات المتجر' : 'إنشاء متجر جديد'}</p>
            {!store && <p className="text-xs text-white/50">سيتم إرسال طلب تفعيل المتجر لمراجعة الإدارة قبل النشر.</p>}
            {store?.status === 'rejected' && store.rejection_reason && (
              <p className="text-xs text-red-400">سبب الرفض: {store.rejection_reason}</p>
            )}
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المتجر" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
            <Input value={form.slug} disabled={!!store} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="المعرّف (username)" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف المتجر" className="bg-white/[0.05] border-white/[0.08] rounded-xl" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-white/[0.05] border border-white/[0.08] h-11 rounded-xl px-3 text-sm">
              {MP_CATEGORIES.map((c) => <option key={c.id} value={c.id} className="bg-black">{c.ar}</option>)}
            </select>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="الموقع / المدينة" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
            <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="رقم التواصل" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
            <Input value={form.contact_whatsapp} onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} placeholder="واتساب" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <label className="p-3 rounded-xl bg-white/[0.04] border border-dashed border-white/15 text-xs text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center gap-1">
                <ImageIcon className="w-4 h-4" />{form.logo_url ? 'تغيير الشعار' : 'رفع الشعار'}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'logo_url', 'store')} />
              </label>
              <label className="p-3 rounded-xl bg-white/[0.04] border border-dashed border-white/15 text-xs text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center gap-1">
                <ImageIcon className="w-4 h-4" />{form.cover_url ? 'تغيير الغلاف' : 'رفع الغلاف'}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'cover_url', 'store')} />
              </label>
            </div>
            <Button disabled={saving} onClick={saveStore} className="w-full h-11 rounded-xl bg-primary text-black font-bold">
              {store ? 'حفظ التغييرات' : 'إرسال طلب التفعيل'}
            </Button>
          </section>
        )}

        {store && tab === 'products' && (
          <section className="space-y-3">
            <Button onClick={() => { setEditing(null); setPForm(emptyProduct); setProductDialog(true); }} className="w-full h-11 rounded-xl bg-primary text-black font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة منتج
            </Button>
            {products.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.05] shrink-0">
                  {p.image_url && <img src={p.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{p.name}</p>
                  <p className="text-xs text-primary">{formatMoney(effectivePrice(p), p.currency)} · مخزون {p.stock}</p>
                  <p className="text-[11px] text-white/40">{PRODUCT_STATUS_AR[p.status]} · مبيعات {p.sales_count}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button size="sm" variant="outline" className="rounded-lg border-white/15 h-8 text-[11px]" onClick={() => { setEditing(p); setPForm({ ...emptyProduct, ...p, price: String(p.price), discount_price: p.discount_price ? String(p.discount_price) : '', stock: String(p.stock), shipping_fee: String(p.shipping_fee || 0) }); setProductDialog(true); }}>تعديل</Button>
                    <Button size="sm" variant="outline" className="rounded-lg border-white/15 h-8 text-[11px]" onClick={() => duplicateProduct(p)}><Copy className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" className="rounded-lg border-white/15 h-8 text-[11px] text-red-400" onClick={() => removeProduct(p)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-white/40 text-sm py-10">لا توجد منتجات</p>}
          </section>
        )}

        {store && tab === 'orders' && (
          <section className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">{o.order_number}</span>
                  <span className="text-primary">{ORDER_STATUS_AR[o.status]}</span>
                </div>
                <p className="text-xs text-white/60">{o.buyer_name} · {o.buyer_phone}</p>
                <p className="text-xs text-white/40">{o.address}</p>
                {(o.items || []).map((it: any) => (
                  <p key={it.id} className="text-xs text-white/70">{it.product_name} × {it.quantity}</p>
                ))}
                <div className="text-xs text-white/50 flex justify-between pt-1 border-t border-white/[0.06]">
                  <span>الإجمالي {formatMoney(o.total_amount, o.currency)}</span>
                  <span>صافيك {formatMoney(o.merchant_net, o.currency)} (عمولة {o.commission_rate}%)</span>
                </div>
                <div className="flex gap-2 flex-wrap pt-1">
                  {['confirmed', 'preparing', 'shipped', 'delivered', 'completed'].map((s) => (
                    <Button key={s} size="sm" variant="outline" className="rounded-lg border-white/15 h-8 text-[11px]" onClick={() => setFulfilment(o.id, s)}>{ORDER_STATUS_AR[s]}</Button>
                  ))}
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-center text-white/40 text-sm py-10">لا توجد طلبات</p>}
          </section>
        )}

        {store && tab === 'balance' && balances && (
          <section className="grid grid-cols-2 gap-3">
            {[
              ['إجمالي المبيعات', balances.gross_sales],
              ['عمولة Networkk', balances.commission],
              ['رسوم الدفع', balances.processor_fees],
              ['الاسترجاعات', balances.refunds],
              ['الرصيد المعلّق', balances.pending],
              ['الرصيد المتاح', balances.available],
              ['المدفوع', balances.paid],
              ['صافي الأرباح', balances.lifetime_net],
            ].map(([label, val]) => (
              <div key={label as string} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <p className="text-[11px] text-white/40">{label}</p>
                <p className="text-base font-bold text-primary mt-1">{formatMoney(val as number)}</p>
              </div>
            ))}
          </section>
        )}

        {store && tab === 'payouts' && (
          <section className="space-y-3">
            <div className={`p-3 rounded-2xl border text-xs ${store.payouts_enabled ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              {PAYOUT_STATE_AR[store.payout_state] || 'بانتظار توثيق النشاط التجاري'}
              {!store.payouts_enabled && ' — يجب توثيق النشاط التجاري (KYC) من الإدارة قبل تفعيل السحوبات.'}
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <p className="text-sm font-bold">طلب سحب</p>
              <p className="text-xs text-white/50">الرصيد المتاح: {formatMoney(balances?.available || 0)}</p>
              <p className="text-[11px] text-white/35">
                يُصرف الرصيد بعد انتهاء فترة التسوية المحددة من الإدارة، والمبالغ بالدينار العراقي ولا علاقة لها برصيد R Coin.
              </p>
              <Input value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} inputMode="numeric" placeholder="المبلغ" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
              <Input value={payoutDest} onChange={(e) => setPayoutDest(e.target.value)} placeholder="جهة الاستلام (زين كاش / حساب بنكي)" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
              <Button disabled={!store.payouts_enabled} onClick={requestPayout} className="w-full h-11 rounded-xl bg-primary text-black font-bold disabled:opacity-40">
                إرسال الطلب
              </Button>
            </div>
            {payouts.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex justify-between text-xs">
                <span>{formatMoney(p.amount, p.currency)}</span>
                <span className="text-primary">{PAYOUT_STATUS_AR[p.status]}</span>
              </div>
            ))}
          </section>
        )}

      </main>

      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="bg-black border-white/10 max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editing ? 'تعديل منتج' : 'منتج جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="اسم المنتج" className="bg-white/[0.05] border-white/[0.08]" />
            <Textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} placeholder="الوصف" className="bg-white/[0.05] border-white/[0.08]" />
            <select value={pForm.category} onChange={(e) => setPForm({ ...pForm, category: e.target.value })} className="w-full bg-white/[0.05] border border-white/[0.08] h-11 rounded-xl px-3 text-sm">
              {MP_CATEGORIES.map((c) => <option key={c.id} value={c.id} className="bg-black">{c.ar}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <Input value={pForm.price} onChange={(e) => setPForm({ ...pForm, price: e.target.value })} inputMode="numeric" placeholder="السعر" className="bg-white/[0.05] border-white/[0.08]" />
              <Input value={pForm.discount_price} onChange={(e) => setPForm({ ...pForm, discount_price: e.target.value })} inputMode="numeric" placeholder="سعر الخصم" className="bg-white/[0.05] border-white/[0.08]" />
              <Input value={pForm.stock} onChange={(e) => setPForm({ ...pForm, stock: e.target.value })} inputMode="numeric" placeholder="المخزون" className="bg-white/[0.05] border-white/[0.08]" />
              <Input value={pForm.sku} onChange={(e) => setPForm({ ...pForm, sku: e.target.value })} placeholder="SKU" className="bg-white/[0.05] border-white/[0.08]" />
              <Input value={pForm.weight} onChange={(e) => setPForm({ ...pForm, weight: e.target.value })} inputMode="numeric" placeholder="الوزن (كغ)" className="bg-white/[0.05] border-white/[0.08]" />
              <Input value={pForm.shipping_fee} onChange={(e) => setPForm({ ...pForm, shipping_fee: e.target.value })} inputMode="numeric" placeholder="أجور الشحن" className="bg-white/[0.05] border-white/[0.08]" />
            </div>
            <Input value={pForm.shipping_info} onChange={(e) => setPForm({ ...pForm, shipping_info: e.target.value })} placeholder="معلومات الشحن" className="bg-white/[0.05] border-white/[0.08]" />
            <label className="block p-3 rounded-xl bg-white/[0.04] border border-dashed border-white/15 text-xs text-center cursor-pointer">
              {pForm.image_url ? 'تغيير الصورة الرئيسية' : 'رفع الصورة الرئيسية'}
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'image_url', 'product')} />
            </label>
            <select value={pForm.status} onChange={(e) => setPForm({ ...pForm, status: e.target.value })} className="w-full bg-white/[0.05] border border-white/[0.08] h-11 rounded-xl px-3 text-sm">
              <option value="draft" className="bg-black">مسودة</option>
              <option value="pending" className="bg-black">إرسال للمراجعة</option>
              <option value="published" className="bg-black">منشور</option>
            </select>
          </div>
          <DialogFooter><Button disabled={saving} onClick={saveProduct} className="bg-primary text-black">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessStore;
