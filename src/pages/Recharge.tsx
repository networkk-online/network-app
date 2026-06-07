import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, HelpCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import visaLogo from '@/assets/visa-logo.png';
import mastercardLogo from '@/assets/mastercard-logo.jpg';
import zaincashLogo from '@/assets/zaincash-logo.jpg';
import SeoHead from '@/components/seo/SeoHead';

const EXCHANGE_RATE = 1500;

const PACKAGES = [
  { id: 1, coins: 65, priceUSD: 0.99 },
  { id: 2, coins: 330, priceUSD: 4.99 },
  { id: 3, coins: 660, priceUSD: 9.99, popular: true },
  { id: 4, coins: 1321, priceUSD: 19.99 },
  { id: 5, coins: 3303, priceUSD: 49.99 },
  { id: 6, coins: 6607, priceUSD: 99.99 },
];

const Recharge = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [redeemCode, setRedeemCode] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const loadBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_gems')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setBalance(data.balance);
    };
    loadBalance();
  }, []);

  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    return clean.replace(/(.{4})/g, '$1-').slice(0, 14);
  };

  const isCodeValid = redeemCode.replace(/-/g, '').length === 12;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead route="/recharge" />
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border/20"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-bold text-foreground text-base">إعادة الشحن</h1>
      </div>

      {/* Current Balance */}
      <div className="flex items-center justify-center gap-3 py-5 border-b border-border/10">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)' }}>
          <Coins className="w-5 h-5 text-black" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">رصيدك الحالي</p>
          <p className="text-xl font-black text-foreground">{balance.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">عملة</span></p>
        </div>
      </div>

      {/* Coin Packages */}
      <div className="px-4 py-4">
        {PACKAGES.map((pkg, i) => {
          const priceIQD = pkg.priceUSD * EXCHANGE_RATE;
          const hasBonus = priceIQD >= 50000;
          const bonusCoins = hasBonus ? Math.floor(pkg.coins * 0.05) : 0;
          
          return (
            <motion.button
              key={pkg.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(15); }}
              className="w-full flex items-center justify-between py-3.5 px-1 border-b border-border/10 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <div className="text-right">
                  <p className="font-bold text-foreground text-[15px]">
                    {pkg.coins} عملة
                    {hasBonus && <span className="text-primary text-xs mr-1">+{bonusCoins} مكافأة!</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {priceIQD.toLocaleString('ar-IQ')} د.ع
                  </p>
                </div>
                {pkg.popular && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000' }}>
                    الأكثر شعبية
                  </span>
                )}
                {hasBonus && !pkg.popular && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    +5% مكافأة
                  </span>
                )}
              </div>
              <div className="px-5 py-2 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,165,0,0.06))',
                  border: '1px solid rgba(255,215,0,0.2)',
                  color: '#ffd700',
                }}>
                ${pkg.priceUSD}
              </div>
            </motion.button>
          );
        })}

        {/* Bonus info banner */}
        <div className="mt-3 p-3 rounded-xl border border-primary/15 bg-primary/5 flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <p className="text-[11px] text-primary">الطلبات بقيمة 50,000 د.ع أو أكثر تحصل على مكافأة 5% إضافية!</p>
        </div>
      </div>

      {/* Redeem Code Section */}
      <div className="mx-4 mt-2 mb-4 rounded-2xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.02))',
        border: '1px dashed rgba(255,215,0,0.2)',
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4" style={{ color: '#ffd700' }} />
          <span className="text-sm font-bold text-foreground">هل لديك رمز هدية؟</span>
        </div>
        <div className="flex gap-2">
          <Input
            value={redeemCode}
            onChange={(e) => setRedeemCode(formatCode(e.target.value))}
            placeholder="XXXX-XXXX-XXXX"
            className="font-mono text-center tracking-[0.2em] bg-background/50 border-border/30 h-12"
            maxLength={14}
            dir="ltr"
          />
          <Button
            onClick={() => { if (navigator.vibrate) navigator.vibrate(30); navigate('/redeem'); }}
            disabled={!isCodeValid}
            className="shrink-0 px-5 h-12 font-bold disabled:opacity-40 transition-shadow"
            style={{
              background: isCodeValid ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : undefined,
              color: isCodeValid ? '#000' : undefined,
              boxShadow: isCodeValid ? '0 0 20px rgba(255,215,0,0.25)' : undefined,
            }}
          >
            تفعيل
          </Button>
        </div>

        <button onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1 mt-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="w-3 h-3" />
          كيفية الشراء؟
        </button>
        {showGuide && (
          <div className="mt-2 space-y-1.5">
            {['اشترِ بطاقة شحن من أقرب محل', 'ستجد رمزاً من 12 خانة خلف البطاقة', 'أدخل الرمز واضغط "تفعيل"'].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-[10px] text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods Footer */}
      <div className="sticky bottom-0 px-4 py-3 border-t border-border/10 flex items-center justify-center gap-4"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <span className="text-[10px] text-muted-foreground">طرق الدفع المدعومة:</span>
        <div className="flex items-center gap-2.5">
          <img src={visaLogo} alt="Visa" className="h-5 rounded object-contain opacity-70" />
          <img src={mastercardLogo} alt="Mastercard" className="h-5 rounded object-contain opacity-70" />
          <img src={zaincashLogo} alt="ZainCash" className="h-5 rounded object-contain opacity-70" />
        </div>
      </div>
    </div>
  );
};

export default Recharge;
