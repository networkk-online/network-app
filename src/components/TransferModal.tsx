import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Search, Coins, AlertCircle, FileText, Wallet, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

const TRANSFER_FEE_RATE = 0.02; // 2%

const TransferModal = ({ isOpen, onClose }: TransferModalProps) => {
  const { toast } = useToast();
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'password' | 'success'>('form');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [liveBalance, setLiveBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const fee = Math.max(Math.ceil(numAmount * TRANSFER_FEE_RATE), 1);
  const total = numAmount > 0 ? numAmount + fee : 0;
  const canTransfer = recipientProfile && numAmount > 0 && total <= liveBalance;

  // Fetch gems balance directly when modal opens
  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBalanceLoading(false); return; }
    const { data } = await supabase
      .from('user_gems')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    setLiveBalance(data ? Number(data.balance) || 0 : 0);
    setBalanceLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen, fetchBalance]);

  useEffect(() => {
    if (!recipientQuery || recipientQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => searchUsers(recipientQuery), 400);
    return () => clearTimeout(timer);
  }, [recipientQuery]);

  const searchUsers = async (query: string) => {
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  };

  const selectRecipient = (profile: any) => {
    setRecipientProfile(profile);
    setRecipientQuery(profile.username || profile.full_name || '');
    setSearchResults([]);
  };

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (user.id === recipientProfile.id) {
        toast({ title: 'خطأ', description: 'لا يمكنك التحويل لنفسك', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      // Re-check sender gems at transaction time
      const { data: senderGems } = await supabase
        .from('user_gems')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!senderGems || Number(senderGems.balance) < total) {
        toast({ title: 'خطأ', description: 'رصيدك لا يكفي لتغطية مبلغ التحويل والعمولة', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      // Deduct from sender (amount + fee)
      await supabase
        .from('user_gems')
        .update({ balance: Number(senderGems.balance) - total })
        .eq('user_id', user.id);

      // Add to recipient (only the transfer amount, not the fee)
      const { data: recipientGems } = await supabase
        .from('user_gems')
        .select('balance, total_earned')
        .eq('user_id', recipientProfile.id)
        .maybeSingle();

      if (recipientGems) {
        await supabase
          .from('user_gems')
          .update({ balance: Number(recipientGems.balance) + numAmount, total_earned: Number(recipientGems.total_earned) + numAmount })
          .eq('user_id', recipientProfile.id);
      } else {
        await supabase.from('user_gems').insert({
          user_id: recipientProfile.id,
          balance: numAmount,
          total_earned: numAmount,
        });
      }

      // Record transaction for sender
      await supabase.from('transactions').insert({
        user_id: user.id,
        admin_id: recipientProfile.id,
        amount: numAmount,
        type: 'transfer_out',
        status: 'completed',
        notes: `تحويل إلى ${recipientProfile.username || recipientProfile.full_name}${note ? ' - ' + note : ''} (عمولة 2%: ${fee} جوهرة)`,
      });

      // Record transaction for receiver
      await supabase.from('transactions').insert({
        user_id: recipientProfile.id,
        admin_id: user.id,
        amount: numAmount,
        type: 'transfer_in',
        status: 'completed',
        notes: `تحويل من مستخدم${note ? ' - ' + note : ''}`,
      });

      // Record fee as system earnings
      await supabase.from('transactions').insert({
        user_id: user.id,
        admin_id: user.id,
        amount: fee,
        type: 'transfer_fee',
        status: 'completed',
        notes: `عمولة تحويل 2% من ${numAmount} جوهرة`,
      });

      // Update local balance
      setLiveBalance(prev => prev - total);

      setStep('success');
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

      toast({
        title: 'تم التحويل بنجاح ✅',
        description: `تم تحويل ${numAmount.toLocaleString()} عملة إلى ${recipientProfile.username || recipientProfile.full_name} بنجاح`,
      });

      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التحويل', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setRecipientQuery('');
    setRecipientProfile(null);
    setAmount('');
    setNote('');
    setSecurityPassword('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const setMax = () => {
    const maxAfterFee = Math.floor(liveBalance / (1 + TRANSFER_FEE_RATE));
    setAmount(String(Math.max(0, maxAfterFee)));
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const proceedToPassword = () => {
    setStep('password');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const verifyPassword = () => {
    if (securityPassword === '123456') {
      handleConfirm();
    } else {
      toast({ title: 'خطأ', description: 'كلمة المرور غير صحيحة', variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] border-t max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(8,8,15,0.99) 100%)',
              borderColor: 'hsl(var(--primary) / 0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 rounded-full bg-primary/30" />
            </div>

            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground">تحويل عملات</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="mx-4 mb-4 p-3 rounded-2xl flex items-center justify-between" style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))',
              border: '1px solid hsl(var(--primary) / 0.12)',
            }}>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">رصيدك المتاح</span>
              </div>
              <span className="font-black text-foreground">
                {balanceLoading ? '...' : `${liveBalance.toLocaleString()} 💎`}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {step === 'success' ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="px-4 pb-10 flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-xl font-black text-primary">تم التحويل بنجاح! ✅</p>
                  <p className="text-sm text-muted-foreground">{numAmount.toLocaleString()} عملة → {recipientProfile?.username}</p>
                  {note && <p className="text-xs text-muted-foreground">"{note}"</p>}
                </motion.div>
              ) : step === 'password' ? (
                <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pb-8 space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="w-10 h-10 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">أدخل كلمة المرور الأمنية</p>
                  </div>
                  <Input
                    type="password"
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="bg-background/50 border-border/30 text-center text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1 rounded-2xl border-border/30">رجوع</Button>
                    <Button onClick={verifyPassword} disabled={!securityPassword || isProcessing} className="flex-1 rounded-2xl">
                      {isProcessing ? 'جاري التحويل...' : 'تأكيد'}
                    </Button>
                  </div>
                </motion.div>
              ) : step === 'confirm' ? (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pb-8 space-y-4">
                  <div className="rounded-2xl p-4 space-y-3 border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المستلم</span>
                      <span className="font-bold text-foreground">{recipientProfile?.username || recipientProfile?.full_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المبلغ</span>
                      <span className="font-bold text-foreground">{numAmount.toLocaleString()} عملة</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">عمولة التحويل (2%)</span>
                      <span className="font-bold text-foreground">{fee.toLocaleString()} عملة</span>
                    </div>
                    {note && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ملاحظة</span>
                        <span className="font-medium text-foreground text-right max-w-[60%] truncate">{note}</span>
                      </div>
                    )}
                    <div className="border-t border-border/20 pt-2 flex justify-between text-sm">
                      <span className="font-bold text-foreground">الإجمالي المخصوم</span>
                      <span className="font-black text-primary text-lg">{total.toLocaleString()} 💎</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('form')} className="flex-1 rounded-2xl border-border/30">رجوع</Button>
                    <Button onClick={proceedToPassword} className="flex-1 rounded-2xl">متابعة</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pb-8 space-y-4">
                  {/* Recipient Search */}
                  <div className="relative">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">المستلم</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={recipientQuery}
                        onChange={(e) => { setRecipientQuery(e.target.value); setRecipientProfile(null); }}
                        placeholder="ابحث باسم المستخدم أو رقم الهاتف"
                        className="pl-9 bg-background/50 border-border/30"
                      />
                    </div>
                    {searchResults.length > 0 && !recipientProfile && (
                      <div className="absolute z-10 w-full mt-1 rounded-xl border border-border/30 bg-card overflow-hidden shadow-xl">
                        {searchResults.map((u) => (
                          <button key={u.id} onClick={() => selectRecipient(u)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-right">
                            <img src={u.avatar_url || '/default-avatar.jpg'} className="w-8 h-8 rounded-full object-cover" alt="" />
                            <div>
                              <p className="text-sm font-bold text-foreground">{u.username || u.full_name}</p>
                              {u.full_name && u.username && <p className="text-xs text-muted-foreground">{u.full_name}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {recipientProfile && (
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-primary/5 border border-primary/15">
                        <img src={recipientProfile.avatar_url || '/default-avatar.jpg'} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-sm font-bold text-primary">{recipientProfile.username || recipientProfile.full_name}</span>
                        <button onClick={() => { setRecipientProfile(null); setRecipientQuery(''); }} className="ml-auto text-xs text-muted-foreground">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">المبلغ</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="عدد العملات" className="pl-9 pr-16 bg-background/50 border-border/30" min={1} max={liveBalance} />
                      <button onClick={setMax} className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/15 text-primary hover:bg-primary/25 transition-colors">MAX</button>
                    </div>
                    {numAmount > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">عمولة التحويل (2%): {fee.toLocaleString()} جوهرة · الإجمالي: {total.toLocaleString()} عملة</span>
                      </div>
                    )}
                    {numAmount > 0 && total > liveBalance && (
                      <p className="text-[10px] text-destructive mt-1">رصيدك لا يكفي لتغطية مبلغ التحويل والعمولة</p>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map(v => (
                      <button key={v} onClick={() => { setAmount(String(v)); if (navigator.vibrate) navigator.vibrate(10); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${amount === String(v) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/20 bg-muted/10 text-foreground hover:border-border/40'}`}>
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ملاحظة (اختياري)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب التحويل..." className="pl-9 bg-background/50 border-border/30" maxLength={100} />
                    </div>
                  </div>

                  <Button onClick={() => { setStep('confirm'); if (navigator.vibrate) navigator.vibrate(20); }} disabled={!canTransfer} className="w-full h-12 rounded-2xl font-bold text-base disabled:opacity-40">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    متابعة ({total.toLocaleString()} عملة)
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;
