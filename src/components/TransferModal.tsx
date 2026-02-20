import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Search, Coins, AlertCircle, FileText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
}

const TRANSFER_FEE = 0.01; // 1%

const TransferModal = ({ isOpen, onClose, currentBalance = 0 }: TransferModalProps) => {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const numAmount = parseFloat(amount) || 0;
  const fee = Math.ceil(numAmount * TRANSFER_FEE);
  const total = numAmount + fee;
  const canTransfer = recipientId.trim() && numAmount > 0 && total <= currentBalance;

  const handleConfirm = () => {
    setStep('success');
    if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
    setTimeout(() => {
      setStep('form');
      setRecipientId('');
      setAmount('');
      setNote('');
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  const setMax = () => {
    const maxAfterFee = Math.floor(currentBalance / (1 + TRANSFER_FEE));
    setAmount(String(Math.max(0, maxAfterFee)));
    if (navigator.vibrate) navigator.vibrate(15);
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] border-t"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(8,8,15,0.99) 100%)',
              borderColor: 'hsl(var(--primary) / 0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 rounded-full bg-primary/30" />
            </div>

            {/* Header with balance */}
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

            {/* Balance badge */}
            <div className="mx-4 mb-4 p-3 rounded-2xl flex items-center justify-between" style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))',
              border: '1px solid hsl(var(--primary) / 0.12)',
            }}>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">رصيدك المتاح</span>
              </div>
              <span className="font-black text-foreground">{currentBalance.toLocaleString()} 💎</span>
            </div>

            <AnimatePresence mode="wait">
              {step === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-10 flex flex-col items-center gap-4 py-8"
                >
                  {/* Enhanced coin animation */}
                  <div className="relative w-48 h-24">
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute left-4 top-1/2"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{
                          x: 160,
                          y: [0, -(15 + Math.random() * 25), 0],
                          opacity: [1, 1, 0],
                          scale: [1, 1.2, 0.6],
                          rotate: [0, 180 + Math.random() * 180],
                        }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                      >
                        <span className="text-lg">💰</span>
                      </motion.div>
                    ))}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ scale: [1, 0.9, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))', border: '2px solid hsl(var(--primary) / 0.3)' }}
                      >
                        <span className="text-xl">👤</span>
                      </motion.div>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, delay: 0.5, repeat: 2 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))', border: '2px solid hsl(var(--primary) / 0.3)' }}
                      >
                        <span className="text-xl">👤</span>
                      </motion.div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                    className="text-center"
                  >
                    <p className="text-xl font-black text-primary mb-1">تم التحويل بنجاح! ✅</p>
                    <p className="text-sm text-muted-foreground">{numAmount.toLocaleString()} عملة → {recipientId}</p>
                    {note && <p className="text-xs text-muted-foreground mt-1">"{note}"</p>}
                  </motion.div>
                </motion.div>
              ) : step === 'confirm' ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-4 pb-8 space-y-4"
                >
                  <div className="rounded-2xl p-4 space-y-3 border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المستلم</span>
                      <span className="font-bold text-foreground">{recipientId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المبلغ</span>
                      <span className="font-bold text-foreground">{numAmount.toLocaleString()} عملة</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رسوم التحويل (1%)</span>
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
                    <Button variant="outline" onClick={() => setStep('form')} className="flex-1 rounded-2xl border-border/30">
                      رجوع
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1 rounded-2xl">
                      تأكيد التحويل
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-8 space-y-4"
                >
                  {/* Recipient */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">معرّف المستلم</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        placeholder="ابحث باسم المستخدم أو المعرّف"
                        className="pl-9 bg-background/50 border-border/30"
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">المبلغ</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="عدد العملات"
                        className="pl-9 pr-16 bg-background/50 border-border/30"
                        min={1}
                      />
                      <button
                        onClick={setMax}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    {numAmount > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          رسوم 1%: {fee.toLocaleString()} عملة · الإجمالي: {total.toLocaleString()} عملة
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map(v => (
                      <button
                        key={v}
                        onClick={() => {
                          setAmount(String(v));
                          if (navigator.vibrate) navigator.vibrate(10);
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          amount === String(v) ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border/20 bg-muted/10 text-foreground hover:border-border/40'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ملاحظة (اختياري)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="سبب التحويل..."
                        className="pl-9 bg-background/50 border-border/30"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setStep('confirm');
                      if (navigator.vibrate) navigator.vibrate(20);
                    }}
                    disabled={!canTransfer}
                    className="w-full h-12 rounded-2xl font-bold text-base disabled:opacity-40"
                  >
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
