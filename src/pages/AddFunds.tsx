import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Languages, ShieldCheck, Zap, Gift, Sparkles, Check, Loader2, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import SeoHead from '@/components/seo/SeoHead';

type Gateway = {
  id: string;
  key: string;
  name_en: string;
  name_ar: string;
  icon: string | null;
  is_active: boolean;
  min_amount: number;
  max_amount: number;
  bonus_percent: number;
  instructions_ar: string | null;
  instructions_en: string | null;
  barcode_image_url?: string | null;
};

type Pkg = { id: number; coins: number; priceUSD: number; popular?: boolean };

const PACKAGES: Pkg[] = [
  { id: 1, coins: 65, priceUSD: 0.99 },
  { id: 2, coins: 330, priceUSD: 4.99 },
  { id: 3, coins: 660, priceUSD: 9.99, popular: true },
  { id: 4, coins: 1321, priceUSD: 19.99 },
  { id: 5, coins: 3303, priceUSD: 49.99 },
  { id: 6, coins: 6607, priceUSD: 99.99 },
];

const NEON = '#00ff66';

const T = {
  ar: {
    dir: 'rtl' as const,
    title: 'شحن الرصيد',
    subtitle: 'اختر باقتك ثم طريقة الدفع المناسبة',
    step1: 'اختر الباقة',
    step2: 'اختر طريقة الدفع',
    step3: 'تأكيد',
    coins: 'عملة',
    popular: 'الأكثر شعبية',
    next: 'متابعة',
    back: 'رجوع',
    pay: 'تأكيد والدفع الآن',
    none: 'لا توجد طرق دفع مفعّلة حالياً',
    instructions: 'تعليمات الدفع',
    min: 'الحد الأدنى', max: 'الحد الأقصى', bonus: 'مكافأة',
    selectedPackage: 'الباقة المختارة',
    method: 'طريقة الدفع',
    amount: 'المبلغ',
    outOfRange: (min: number, max: number) => `هذه الطريقة تقبل من $${min} إلى $${max} فقط`,
    success: 'تم إرسال طلب الشحن',
    f1: 'معاملات فورية ومشفّرة',
    f2: 'لا توجد رسوم خفية',
    f3: 'مكافآت على الدفعات الكبيرة',
  },
  en: {
    dir: 'ltr' as const,
    title: 'Add Funds',
    subtitle: 'Pick a package then a payment method',
    step1: 'Choose Package',
    step2: 'Choose Payment',
    step3: 'Confirm',
    coins: 'coins',
    popular: 'Most Popular',
    next: 'Continue',
    back: 'Back',
    pay: 'Confirm & Pay Now',
    none: 'No active payment methods right now',
    instructions: 'Payment instructions',
    min: 'Min', max: 'Max', bonus: 'Bonus',
    selectedPackage: 'Selected package',
    method: 'Payment method',
    amount: 'Amount',
    outOfRange: (min: number, max: number) => `This method accepts $${min} – $${max} only`,
    success: 'Top-up request submitted',
    f1: 'Instant, fully encrypted transactions',
    f2: 'No hidden fees',
    f3: 'Bonuses on larger top-ups',
  },
};

export default function AddFunds() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loadingGw, setLoadingGw] = useState(false);
  const [selectedGwId, setSelectedGwId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const t = T[lang];

  // Realtime fetch of gateways (only when entering step 2)
  useEffect(() => {
    if (step < 2) return;
    let cancelled = false;
    const load = async () => {
      setLoadingGw(true);
      const { data } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      const list = (data as Gateway[]) ?? [];
      setGateways(list);
      // Pick first eligible (in price range) by default
      if (pkg) {
        const eligible = list.find((g) => pkg.priceUSD >= g.min_amount && pkg.priceUSD <= g.max_amount);
        setSelectedGwId(eligible?.id ?? list[0]?.id ?? '');
      }
      setLoadingGw(false);
    };
    load();

    // Live updates: if admin toggles a gateway, reflect immediately
    const ch = supabase
      .channel('payment_gateways_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_gateways' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [step, pkg]);

  const selectedGw = useMemo(
    () => gateways.find((g) => g.id === selectedGwId) ?? null,
    [gateways, selectedGwId],
  );

  const inRange = !!(pkg && selectedGw && pkg.priceUSD >= selectedGw.min_amount && pkg.priceUSD <= selectedGw.max_amount);
  const bonusCoins = pkg && selectedGw && inRange ? Math.floor(pkg.coins * (selectedGw.bonus_percent / 100)) : 0;

  const handlePay = async () => {
    if (!pkg || !selectedGw || !inRange) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    toast({
      title: t.success,
      description: `${pkg.coins} ${t.coins} — ${lang === 'ar' ? selectedGw.name_ar : selectedGw.name_en} ($${pkg.priceUSD})`,
    });
    setSubmitting(false);
  };

  const goBack = () => {
    if (step === 1) navigate(-1);
    else setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  return (
    <div dir={t.dir} className="min-h-screen text-white" style={{ background: '#0b0f19' }}>
      <SeoHead route="/add-funds" />
      {/* Ambient neon glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${NEON}, transparent 60%)` }} />
        <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${NEON}, transparent 60%)` }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={goBack} className="flex items-center gap-2 text-white/70 hover:text-white transition">
          {lang === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          <span className="text-sm">{t.back}</span>
        </button>
        <div className="text-sm font-bold opacity-80">{t.title}</div>
        <button
          onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition text-xs"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </header>

      {/* Stepper */}
      <div className="relative z-10 max-w-3xl mx-auto px-5 pt-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((n, i) => {
            const labels = [t.step1, t.step2, t.step3];
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} className="flex-1 flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all"
                    style={{
                      borderColor: active || done ? NEON : 'rgba(255,255,255,0.15)',
                      background: done
                        ? NEON
                        : active
                          ? `rgba(0,255,102,0.12)`
                          : 'rgba(255,255,255,0.03)',
                      color: done ? '#001a08' : active ? NEON : 'rgba(255,255,255,0.5)',
                      boxShadow: active ? `0 0 16px rgba(0,255,102,0.4)` : undefined,
                    }}
                  >
                    {done ? <Check className="w-4 h-4" /> : n}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: active || done ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    {labels[i]}
                  </span>
                </div>
                {i < 2 && (
                  <div className="flex-1 h-px mx-3" style={{ background: step > n ? NEON : 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-5 py-8">
        <AnimatePresence mode="wait">
          {/* ───────── STEP 1: PACKAGES ───────── */}
          {step === 1 && (
            <motion.section
              key="step1"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" style={{ color: NEON }} />
                <h1 className="text-xl font-black">{t.step1}</h1>
              </div>
              <p className="text-white/50 text-sm mb-5">{t.subtitle}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PACKAGES.map((p) => {
                  const active = pkg?.id === p.id;
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setPkg(p); if (navigator.vibrate) navigator.vibrate(12); }}
                      className="relative rounded-2xl p-4 border text-center transition-all"
                      style={{
                        borderColor: active ? NEON : 'rgba(255,255,255,0.08)',
                        background: active
                          ? `linear-gradient(135deg, rgba(0,255,102,0.16), rgba(0,255,102,0.04))`
                          : 'rgba(255,255,255,0.03)',
                        boxShadow: active ? `0 0 24px rgba(0,255,102,0.28)` : undefined,
                      }}
                    >
                      {p.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: `linear-gradient(135deg, ${NEON}, #00cc52)`, color: '#001a08' }}>
                          {t.popular}
                        </span>
                      )}
                      <div className="text-3xl mb-1">🪙</div>
                      <div className="font-black text-lg" style={{ color: active ? NEON : '#fff' }}>{p.coins}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{t.coins}</div>
                      <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: active ? 'rgba(0,255,102,0.2)' : 'rgba(255,255,255,0.05)',
                          color: active ? NEON : 'rgba(255,255,255,0.85)',
                        }}>
                        ${p.priceUSD}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <ul className="mt-6 grid sm:grid-cols-3 gap-3">
                {[{ i: ShieldCheck, t: t.f1 }, { i: Zap, t: t.f2 }, { i: Gift, t: t.f3 }].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-white/60 border border-white/[0.06] rounded-lg p-3 bg-white/[0.02]">
                    <f.i className="w-4 h-4 shrink-0" style={{ color: NEON }} />
                    {f.t}
                  </li>
                ))}
              </ul>

              <Button
                disabled={!pkg}
                onClick={() => setStep(2)}
                className="w-full h-14 mt-6 text-base font-black rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: pkg ? `linear-gradient(135deg, ${NEON}, #00cc52)` : 'rgba(255,255,255,0.06)',
                  color: pkg ? '#001a08' : 'rgba(255,255,255,0.4)',
                  boxShadow: pkg ? `0 0 24px rgba(0,255,102,0.4)` : undefined,
                }}
              >
                {t.next}
              </Button>
            </motion.section>
          )}

          {/* ───────── STEP 2: GATEWAYS ───────── */}
          {step === 2 && (
            <motion.section
              key="step2"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-5 h-5" style={{ color: NEON }} />
                <h1 className="text-xl font-black">{t.step2}</h1>
              </div>
              {pkg && (
                <p className="text-white/50 text-sm mb-5">
                  {t.selectedPackage}: <b className="text-white">{pkg.coins} {t.coins}</b> — <span style={{ color: NEON }}>${pkg.priceUSD}</span>
                </p>
              )}

              {loadingGw ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: NEON }} />
                </div>
              ) : gateways.length === 0 ? (
                <div className="py-16 text-center text-white/50 text-sm border border-dashed border-white/10 rounded-2xl">
                  {t.none}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {gateways.map((g) => {
                      const active = g.id === selectedGwId;
                      const eligible = pkg ? pkg.priceUSD >= g.min_amount && pkg.priceUSD <= g.max_amount : true;
                      return (
                        <button
                          key={g.id}
                          onClick={() => { setSelectedGwId(g.id); if (navigator.vibrate) navigator.vibrate(10); }}
                          disabled={!eligible}
                          className="text-start rounded-2xl p-4 border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            borderColor: active ? NEON : 'rgba(255,255,255,0.08)',
                            background: active
                              ? `linear-gradient(135deg, rgba(0,255,102,0.14), rgba(0,255,102,0.03))`
                              : 'rgba(255,255,255,0.03)',
                            boxShadow: active ? `0 0 20px rgba(0,255,102,0.25)` : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const logo = getGatewayLogo(g.key, g.name_en);
                                return logo ? (
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10" style={{ background: logo.bg || '#fff' }}>
                                    <img src={logo.url} alt={logo.alt} className="max-w-[80%] max-h-[70%] object-contain" />
                                  </div>
                                ) : (
                                  <span className="text-2xl">{g.icon}</span>
                                );
                              })()}
                              <div>
                                <div className="font-bold text-sm" style={{ color: active ? NEON : '#fff' }}>
                                  {lang === 'ar' ? g.name_ar : g.name_en}
                                </div>
                                <div className="text-[10px] text-white/40">
                                  ${g.min_amount} – ${g.max_amount}
                                  {g.bonus_percent > 0 && <span className="ms-2" style={{ color: NEON }}>+{g.bonus_percent}%</span>}
                                </div>
                              </div>
                            </div>
                            {active && <Check className="w-5 h-5" style={{ color: NEON }} />}
                          </div>
                          {!eligible && pkg && (
                            <p className="text-[10px] text-red-300/70 mt-1">
                              {t.outOfRange(g.min_amount, g.max_amount)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedGw && (
                    <div
                      className="mt-4 rounded-xl p-4 border"
                      style={{
                        borderColor: 'rgba(0,255,102,0.2)',
                        background: 'linear-gradient(135deg, rgba(0,255,102,0.06), rgba(0,255,102,0.02))',
                      }}
                    >
                      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: NEON }}>
                        {t.instructions}
                      </div>
                      <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                        {(lang === 'ar' ? selectedGw.instructions_ar : selectedGw.instructions_en) || '—'}
                      </p>
                      {selectedGw.barcode_image_url && (
                        <div className="mt-4 flex flex-col items-center">
                          <div className="text-[11px] uppercase tracking-widest mb-2 text-white/50">
                            {lang === 'ar' ? 'امسح الباركود للتحويل' : 'Scan barcode to transfer'}
                          </div>
                          <img
                            src={selectedGw.barcode_image_url}
                            alt="Payment barcode / QR"
                            className="w-56 h-56 object-contain rounded-xl bg-white p-2"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <Button
                disabled={!selectedGw || !inRange}
                onClick={() => setStep(3)}
                className="w-full h-14 mt-6 text-base font-black rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: selectedGw && inRange ? `linear-gradient(135deg, ${NEON}, #00cc52)` : 'rgba(255,255,255,0.06)',
                  color: selectedGw && inRange ? '#001a08' : 'rgba(255,255,255,0.4)',
                  boxShadow: selectedGw && inRange ? `0 0 24px rgba(0,255,102,0.4)` : undefined,
                }}
              >
                {t.next}
              </Button>
            </motion.section>
          )}

          {/* ───────── STEP 3: CONFIRM ───────── */}
          {step === 3 && pkg && selectedGw && (
            <motion.section
              key="step3"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="rounded-2xl p-6 border backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <h1 className="text-xl font-black mb-1">{t.step3}</h1>
              <p className="text-white/50 text-sm mb-6">{t.subtitle}</p>

              <div className="space-y-3 mb-6">
                <Row label={t.selectedPackage} value={`${pkg.coins} ${t.coins}`} sub={`$${pkg.priceUSD}`} />
                <Row
                  label={t.method}
                  value={`${selectedGw.icon ?? ''} ${lang === 'ar' ? selectedGw.name_ar : selectedGw.name_en}`}
                />
                {bonusCoins > 0 && (
                  <Row label={t.bonus} value={`+${bonusCoins} ${t.coins}`} highlight />
                )}
                <Row label={t.amount} value={`$${pkg.priceUSD}`} highlight />
              </div>

              <Button
                onClick={handlePay}
                disabled={submitting}
                className="w-full h-14 text-base font-black rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #00cc52)`,
                  color: '#001a08',
                  boxShadow: `0 0 24px rgba(0,255,102,0.45)`,
                }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t.pay}
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Row({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-xs uppercase tracking-widest text-white/40">{label}</span>
      <span className="font-bold" style={{ color: highlight ? NEON : '#fff' }}>
        {value} {sub && <span className="text-white/40 text-xs ms-1">({sub})</span>}
      </span>
    </div>
  );
}
