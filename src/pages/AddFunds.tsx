import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Languages, ShieldCheck, Zap, Gift, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

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
};

const NEON = '#00ff66';

const T = {
  ar: {
    dir: 'rtl' as const,
    title: 'شحن الرصيد',
    subtitle: 'اختر طريقة الدفع المناسبة وأكمل عملية الشحن بأمان',
    features: 'مميزات الشحن',
    f1: 'معاملات فورية ومشفّرة بالكامل',
    f2: 'لا توجد رسوم خفية، أنت تدفع ما تراه',
    f3: 'مكافآت ترحيبية على الدفعات الكبيرة',
    instructionsLabel: 'تعليمات الدفع',
    method: 'طريقة الدفع',
    confirmMethod: 'تأكيد الطريقة',
    amount: 'المبلغ (USD)',
    placeholder: 'مثلاً 25',
    pay: 'تأكيد والدفع الآن',
    min: 'الحد الأدنى',
    max: 'الحد الأقصى',
    bonus: 'مكافأة',
    none: 'لا توجد طرق دفع مفعّلة حالياً',
    success: 'تم إرسال طلب الشحن',
    invalid: 'تأكد من المبلغ ومن اختيار الطريقة',
    back: 'رجوع',
  },
  en: {
    dir: 'ltr' as const,
    title: 'Add Funds',
    subtitle: 'Pick a payment method and top up securely.',
    features: 'Why Top Up',
    f1: 'Instant, fully encrypted transactions',
    f2: 'No hidden fees — pay exactly what you see',
    f3: 'Welcome bonuses on larger top-ups',
    instructionsLabel: 'Payment instructions',
    method: 'Payment method',
    confirmMethod: 'Confirm method',
    amount: 'Amount (USD)',
    placeholder: 'e.g. 25',
    pay: 'Confirm & Pay Now',
    min: 'Min',
    max: 'Max',
    bonus: 'Bonus',
    none: 'No active payment methods right now',
    success: 'Top-up request submitted',
    invalid: 'Check amount and selected method',
    back: 'Back',
  },
};

export default function AddFunds() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const t = T[lang];

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      const list = (data as Gateway[]) ?? [];
      setGateways(list);
      if (list.length) setSelectedId(list[0].id);
      setLoading(false);
    })();
  }, []);

  const selected = useMemo(
    () => gateways.find((g) => g.id === selectedId) ?? null,
    [gateways, selectedId],
  );

  const num = Number(amount);
  const valid =
    selected && num >= selected.min_amount && num <= selected.max_amount;
  const bonusGems = selected && valid ? Math.floor(num * (selected.bonus_percent / 100)) : 0;

  const handlePay = async () => {
    if (!valid || !selected) {
      toast({ title: t.invalid, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    // Placeholder: real payment provider integration would go here.
    await new Promise((r) => setTimeout(r, 600));
    toast({ title: t.success, description: `${selected[lang === 'ar' ? 'name_ar' : 'name_en']} — $${num}` });
    setSubmitting(false);
  };

  return (
    <div
      dir={t.dir}
      className="min-h-screen text-white"
      style={{ background: '#0b0f19' }}
    >
      {/* Ambient neon glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${NEON}, transparent 60%)` }} />
        <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(circle, ${NEON}, transparent 60%)` }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white transition">
          <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          <span className="text-sm">{t.back}</span>
        </button>
        <button
          onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition text-xs"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-6">
        {/* RIGHT (in RTL) / LEFT (in LTR) — Info / Features */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-1 lg:order-none rounded-2xl p-6 border backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: `0 0 30px rgba(0,255,102,0.05), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" style={{ color: NEON }} />
            <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
          </div>
          <p className="text-white/60 text-sm mb-6">{t.subtitle}</p>

          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">{t.features}</h3>
          <ul className="space-y-3 mb-7">
            {[
              { icon: ShieldCheck, text: t.f1 },
              { icon: Zap, text: t.f2 },
              { icon: Gift, text: t.f3 },
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                <span
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border"
                  style={{ borderColor: 'rgba(0,255,102,0.25)', background: 'rgba(0,255,102,0.08)' }}
                >
                  <f.icon className="w-4 h-4" style={{ color: NEON }} />
                </span>
                <span className="leading-relaxed">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Dynamic instructions */}
          <div
            className="rounded-xl p-4 border"
            style={{
              borderColor: 'rgba(0,255,102,0.2)',
              background: 'linear-gradient(135deg, rgba(0,255,102,0.06), rgba(0,255,102,0.02))',
            }}
          >
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: NEON }}>
              {t.instructionsLabel}
            </div>
            <p className="text-sm text-white/85 leading-relaxed min-h-[3rem]">
              {selected
                ? (lang === 'ar' ? selected.instructions_ar : selected.instructions_en) || '—'
                : t.none}
            </p>
            {selected && (
              <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-white/60">
                <span>{t.min}: <b className="text-white">${selected.min_amount}</b></span>
                <span>{t.max}: <b className="text-white">${selected.max_amount}</b></span>
                {selected.bonus_percent > 0 && (
                  <span style={{ color: NEON }}>+{selected.bonus_percent}% {t.bonus}</span>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* LEFT (in RTL) / RIGHT (in LTR) — Payment form */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-6 border backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: NEON }} />
            </div>
          ) : gateways.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-sm">{t.none}</div>
          ) : (
            <>
              {/* Quick tabs */}
              <div className="mb-5">
                <label className="text-xs uppercase tracking-widest text-white/40">{t.method}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gateways.map((g) => {
                    const active = g.id === selectedId;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedId(g.id)}
                        className="px-3.5 py-2 rounded-xl text-sm font-medium transition border"
                        style={{
                          borderColor: active ? NEON : 'rgba(255,255,255,0.08)',
                          background: active
                            ? `linear-gradient(135deg, rgba(0,255,102,0.18), rgba(0,255,102,0.04))`
                            : 'rgba(255,255,255,0.03)',
                          color: active ? NEON : 'rgba(255,255,255,0.85)',
                          boxShadow: active ? `0 0 18px rgba(0,255,102,0.25)` : undefined,
                        }}
                      >
                        <span className="me-1.5">{g.icon}</span>
                        {lang === 'ar' ? g.name_ar : g.name_en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dropdown confirm */}
              <div className="mb-5">
                <label className="text-xs uppercase tracking-widest text-white/40">{t.confirmMethod}</label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="mt-2 h-12 bg-white/[0.03] border-white/10 text-white">
                    <SelectValue />
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0f19] border-white/10 text-white">
                    {gateways.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.icon} {lang === 'ar' ? g.name_ar : g.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="text-xs uppercase tracking-widest text-white/40">{t.amount}</label>
                <div className="mt-2 relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={selected?.min_amount}
                    max={selected?.max_amount}
                    placeholder={t.placeholder}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 text-xl font-bold bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 pe-14"
                    dir="ltr"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">USD</span>
                </div>
                {bonusGems > 0 && (
                  <p className="text-xs mt-2" style={{ color: NEON }}>
                    +{bonusGems} {t.bonus} 🎁
                  </p>
                )}
              </div>

              {/* Pay button */}
              <Button
                onClick={handlePay}
                disabled={!valid || submitting}
                className="w-full h-14 text-base font-black rounded-xl transition-all duration-300 disabled:opacity-40"
                style={{
                  background: valid
                    ? `linear-gradient(135deg, ${NEON}, #00cc52)`
                    : 'rgba(255,255,255,0.06)',
                  color: valid ? '#001a08' : 'rgba(255,255,255,0.4)',
                  boxShadow: valid ? `0 0 24px rgba(0,255,102,0.45), 0 0 60px rgba(0,255,102,0.2)` : undefined,
                }}
                onMouseEnter={(e) => {
                  if (valid) e.currentTarget.style.boxShadow = `0 0 40px rgba(0,255,102,0.75), 0 0 90px rgba(0,255,102,0.35)`;
                }}
                onMouseLeave={(e) => {
                  if (valid) e.currentTarget.style.boxShadow = `0 0 24px rgba(0,255,102,0.45), 0 0 60px rgba(0,255,102,0.2)`;
                }}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t.pay}
              </Button>
            </>
          )}
        </motion.section>
      </main>
    </div>
  );
}
