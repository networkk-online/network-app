import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const RedeemGiftCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState(['', '', '']);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; amount?: number; newBalance?: number } | null>(null);
  const [history, setHistory] = useState<Array<{ code: string; coin_amount: number; created_at: string }>>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('gift_redemptions')
      .select('code, coin_amount, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };

  const handleCodeChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);
    // Auto-focus next input
    if (cleaned.length === 4 && index < 2) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  const fullCode = code.join('-');
  const isCodeComplete = code.every(c => c.length === 4);

  const handleRedeem = async () => {
    if (!isCodeComplete || isRedeeming) return;
    setIsRedeeming(true);
    setRedeemResult(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'سجل دخولك أولاً', variant: 'destructive' });
      setIsRedeeming(false);
      return;
    }

    // Find the code
    const { data: giftCode, error } = await supabase
      .from('gift_codes')
      .select('*')
      .eq('code', fullCode)
      .eq('status', 'active')
      .maybeSingle();

    if (!giftCode || error) {
      setRedeemResult({ success: false });
      setIsRedeeming(false);
      return;
    }

    // Check expiration
    if (giftCode.expires_at && new Date(giftCode.expires_at) < new Date()) {
      setRedeemResult({ success: false });
      setIsRedeeming(false);
      return;
    }

    // Mark code as used
    await supabase.from('gift_codes').update({
      status: 'used',
      redeemed_by: user.id,
      redeemed_at: new Date().toISOString(),
    }).eq('id', giftCode.id);

    // Add to user gems
    const { data: existing } = await supabase
      .from('user_gems')
      .select('balance, total_earned')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_gems').update({
        balance: existing.balance + giftCode.coin_amount,
        total_earned: existing.total_earned + giftCode.coin_amount,
      }).eq('user_id', user.id);
    } else {
      await supabase.from('user_gems').insert({
        user_id: user.id,
        balance: giftCode.coin_amount,
        total_earned: giftCode.coin_amount,
      });
    }

    // Record redemption
    await supabase.from('gift_redemptions').insert({
      user_id: user.id,
      code: fullCode,
      coin_amount: giftCode.coin_amount,
    });

    // Record transaction
    const { data: currentFinance } = await supabase
      .from('user_finances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase.from('transactions').insert({
      user_id: user.id,
      admin_id: user.id,
      amount: giftCode.coin_amount,
      type: 'topup',
      status: 'completed',
      notes: 'شحن كود هدية - ' + fullCode,
    });

    const newBalance = (currentFinance?.balance ? Number(currentFinance.balance) : 0) + giftCode.coin_amount;
    setRedeemResult({ success: true, amount: giftCode.coin_amount, newBalance });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setCode(['', '', '']);
    loadHistory();
    setIsRedeeming(false);
  };

  // Confetti particles
  const confettiColors = ['#00f0ff', '#ff0080', '#ffd700', '#08A045', '#a855f7'];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-card">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">استرداد بطاقة هدية</h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* Gift Card Visual */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative rounded-3xl p-6 mb-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0a1a, #1a0a2e, #0a1a2e)',
            border: '1px solid rgba(0,240,255,0.2)',
            boxShadow: '0 0 40px rgba(0,240,255,0.1), inset 0 0 40px rgba(255,0,128,0.05)',
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-6 h-6 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Gift Card</span>
            </div>

            {/* Code Input */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {code.map((segment, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    id={`code-${i}`}
                    type="text"
                    value={segment}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    maxLength={4}
                    placeholder="XXXX"
                    className="w-[72px] h-12 bg-white/5 border border-white/10 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all uppercase"
                  />
                  {i < 2 && <span className="text-white/30 font-bold text-lg">-</span>}
                </div>
              ))}
            </div>

            <Sparkles className="w-4 h-4 text-pink-400 absolute top-2 right-2" />
          </div>
        </motion.div>

        {/* Redeem Button */}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleRedeem}
            disabled={!isCodeComplete || isRedeeming}
            className="w-full h-14 text-lg font-bold rounded-2xl"
            style={{
              background: isCodeComplete
                ? 'linear-gradient(135deg, #00f0ff, #0080ff)'
                : undefined,
              boxShadow: isCodeComplete ? '0 0 30px rgba(0,240,255,0.3)' : undefined,
            }}
          >
            {isRedeeming ? '⏳ جاري الاسترداد...' : '🎁 استرداد الآن'}
          </Button>
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {redeemResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 p-4 rounded-2xl flex items-center gap-3 ${
                redeemResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {redeemResult.success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="font-bold text-emerald-400">تم الاسترداد بنجاح! 🎉</p>
                    <p className="text-sm text-emerald-300/70">+{redeemResult.amount} عملة مضافة لرصيدك</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <p className="font-bold text-red-400">الكود غير صالح أو مُستخدم</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction History */}
        <div className="mt-8">
          <h2 className="text-base font-bold mb-3 text-foreground">سجل الاسترداد</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">لا توجد عمليات استرداد سابقة</p>
          ) : (
            <div className="space-y-2">
              {history.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-foreground">{item.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('ar-IQ')}
                    </p>
                  </div>
                  <span className="text-primary font-bold">+{item.coin_amount} 💎</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="fixed pointer-events-none z-50"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: -20,
                  width: 8 + Math.random() * 8,
                  height: 8 + Math.random() * 8,
                  backgroundColor: confettiColors[i % confettiColors.length],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
                initial={{ y: -20, rotate: 0, opacity: 1 }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: Math.random() * 720,
                  x: (Math.random() - 0.5) * 200,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 2 + Math.random(), ease: 'easeIn', delay: Math.random() * 0.5 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RedeemGiftCard;
