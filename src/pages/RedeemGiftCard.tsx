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

    // Server-side atomic redemption (validates code, credits gems, logs audit)
    const { data, error } = await supabase.rpc('redeem_gift_code' as never, { _code: fullCode } as never);
    const result = data as { success?: boolean; coin_amount?: number; balance?: number; error?: string } | null;

    if (error || !result?.success) {
      setRedeemResult({ success: false });
      setIsRedeeming(false);
      return;
    }

    setRedeemResult({ success: true, amount: result.coin_amount ?? 0, newBalance: result.balance ?? 0 });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    setCode(['', '', '']);
    loadHistory();
    setIsRedeeming(false);
  };


  // Confetti particles
  const confettiColors = ['#08A045', '#00ff41', '#0f0', '#22c55e', '#4ade80'];

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
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 p-5 rounded-2xl ${
                redeemResult.success
                  ? 'bg-primary/5 border border-primary/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
              style={redeemResult.success ? { boxShadow: '0 0 30px hsla(var(--primary) / 0.15)' } : undefined}
            >
              {redeemResult.success ? (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center" style={{ boxShadow: '0 0 20px hsla(var(--primary) / 0.3)' }}>
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-black text-primary text-lg">تم الشحن بنجاح! 🚀</p>
                  <p className="text-sm text-foreground/70">
                    تمت إضافة <span className="font-bold text-primary">+{redeemResult.amount}</span> إلى محفظتك
                  </p>
                  {redeemResult.newBalance !== undefined && (
                    <p className="text-xs text-muted-foreground">رصيدك الجديد: <span className="font-bold text-foreground">{redeemResult.newBalance?.toLocaleString()}</span></p>
                  )}
                  <Button
                    onClick={() => { setRedeemResult(null); navigate('/profile'); }}
                    className="mt-3 rounded-2xl px-6"
                  >
                    تم ✓
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <p className="font-bold text-red-400">الكود غير صالح أو مُستخدم</p>
                </div>
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
