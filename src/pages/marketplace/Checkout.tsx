import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney, effectivePrice } from '@/lib/marketplace';
import { fetchCheckoutQuote, fetchPaymentConfig, startPayment, type CheckoutQuote, type PaymentConfig } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CreditCard, Truck, ShieldCheck } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('cod');
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [config, setConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate('/login'); return; }
      const [{ data: cart }, { data: profile }, cfg] = await Promise.all([
        supabase.from('marketplace_carts')
          .select('*, product:marketplace_products(*), variant:marketplace_product_variants(id,label,price_delta)')
          .eq('user_id', u.user.id),
        supabase.rpc('get_own_profile'),
        fetchPaymentConfig().catch(() => null),
      ]);
      setItems((cart || []).filter((r: any) => r.product));
      const p: any = Array.isArray(profile) ? profile[0] : profile;
      if (p) { setName(p.full_name || p.username || ''); setPhone(p.phone_number || ''); }
      setConfig(cfg);
      setLoading(false);
    })();
  }, [navigate]);

  const cartPayload = useMemo(
    () => items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity })),
    [items],
  );

  const loadQuote = useCallback(async () => {
    if (cartPayload.length === 0) { setQuote(null); return; }
    try {
      setQuote(await fetchCheckoutQuote(cartPayload));
    } catch {
      setQuote(null);
    }
  }, [cartPayload]);

  useEffect(() => { void loadQuote(); }, [loadQuote]);

  const localSubtotal = items.reduce(
    (s, i) => s + (effectivePrice(i.product) + Number(i.variant?.price_delta || 0)) * i.quantity, 0);

  const gatewayAvailable = Boolean(config?.provider_ready);
  const methods = useMemo(() => ([
    { id: 'cod', label: 'الدفع عند الاستلام', icon: Truck, enabled: true },
    {
      id: 'gateway',
      label: gatewayAvailable ? 'بطاقة / بوابة دفع إلكترونية' : 'بوابة الدفع (غير مفعّلة حالياً)',
      icon: CreditCard,
      enabled: gatewayAvailable,
    },
  ]), [gatewayAvailable]);

  const placeOrder = async () => {
    if (!phone.trim() || !address.trim()) {
      toast({ title: 'العنوان ورقم الهاتف مطلوبان', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc('mp_place_order', {
      _items: cartPayload as any,
      _buyer_name: name,
      _buyer_phone: phone,
      _address: address,
      _city: city,
      _note: note,
      _payment_method: method,
    });
    if (error) {
      setSubmitting(false);
      toast({ title: 'تعذر إنشاء الطلب', description: error.message, variant: 'destructive' });
      return;
    }

    const orders = ((data as any)?.orders || []) as { order_id: string }[];

    if (method === 'gateway' && orders.length > 0) {
      try {
        const session = await startPayment(orders[0].order_id);
        setSubmitting(false);
        if (session.checkout_url) {
          window.location.href = session.checkout_url;
          return;
        }
        toast({
          title: 'تم إنشاء الطلب',
          description: 'سيتم تأكيد الدفع تلقائياً بعد استلام تأكيد بوابة الدفع.',
        });
      } catch (e: any) {
        setSubmitting(false);
        toast({
          title: 'تم إنشاء الطلب، لكن تعذر بدء الدفع',
          description: e?.message || 'يمكنك إعادة محاولة الدفع من صفحة الطلبات.',
          variant: 'destructive',
        });
      }
      navigate('/orders');
      return;
    }

    setSubmitting(false);
    toast({ title: 'تم إنشاء طلبك بنجاح', description: 'يمكنك متابعة الحالة من صفحة الطلبات' });
    navigate('/orders');
  };


  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-base font-bold">إتمام الطلب</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <section className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
          <p className="text-sm font-bold">معلومات التوصيل</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="رقم الهاتف *" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="المدينة" className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl" />
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان التفصيلي *" className="bg-white/[0.05] border-white/[0.08] rounded-xl" />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات (اختياري)" className="bg-white/[0.05] border-white/[0.08] rounded-xl" />
        </section>

        <section className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
          <p className="text-sm font-bold mb-1">طريقة الدفع</p>
          {methods.map((m) => (
            <button key={m.id} disabled={!m.enabled} onClick={() => m.enabled && setMethod(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border min-h-[52px] ${!m.enabled ? 'opacity-40 border-white/[0.06] bg-white/[0.02]' : method === m.id ? 'border-primary bg-primary/10' : 'border-white/[0.08] bg-white/[0.03]'}`}>
              <m.icon className="w-4 h-4 text-primary" />
              <span className="text-sm">{m.label}</span>
            </button>
          ))}
          <p className="text-[10px] text-white/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            مدفوعات السوق بالدينار العراقي ومنفصلة تمامًا عن رصيد R Coin والهدايا.
            {config?.environment === 'test' && ' (وضع تجريبي)'}
          </p>
        </section>

        <section className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
          <p className="text-sm font-bold mb-1">ملخص الطلب</p>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-xs text-white/60">
              <span className="truncate pl-2">{i.product.name} × {i.quantity}</span>
              <span>{formatMoney((effectivePrice(i.product) + Number(i.variant?.price_delta || 0)) * i.quantity)}</span>
            </div>
          ))}
          {quote?.stores.map((s) => (
            <div key={s.store_id} className="flex justify-between text-[11px] text-white/40">
              <span>شحن المتجر</span><span>{formatMoney(s.shipping, s.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/[0.06]">
            <span>{quote ? 'الإجمالي (محسوب على الخادم)' : 'المجموع الفرعي'}</span>
            <span className="text-primary">{formatMoney(quote ? quote.grand_total : localSubtotal)}</span>
          </div>
          <p className="text-[10px] text-white/30">تُحتسب الأسعار والشحن والعمولة نهائيًا على الخادم عند تأكيد الطلب.</p>
        </section>

      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-2xl border-t border-white/[0.08] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto">
          <Button disabled={submitting || items.length === 0} onClick={placeOrder} className="w-full h-12 rounded-xl bg-primary text-black font-bold">
            {submitting ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
