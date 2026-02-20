import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, User, Coins, AlertCircle } from 'lucide-react';
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
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const numAmount = parseFloat(amount) || 0;
  const fee = Math.ceil(numAmount * TRANSFER_FEE);
  const total = numAmount + fee;
  const canTransfer = recipientId.trim() && numAmount > 0 && total <= currentBalance;

  const handleConfirm = () => {
    setStep('success');
    // TODO: Actual transfer via Supabase
    setTimeout(() => {
      setStep('form');
      setRecipientId('');
      setAmount('');
      onClose();
    }, 2500);
  };

  const handleClose = () => {
    setStep('form');
    onClose();
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl rounded-t-[24px] border-t border-border"
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="font-bold text-lg text-foreground">تحويل عملات</h3>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
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
                  {/* Coin animation */}
                  <div className="relative w-32 h-20">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute left-0 top-1/2"
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ x: 120, y: [0, -20, 0], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }}
                      >
                        <Coins className="w-5 h-5 text-primary" />
                      </motion.div>
                    ))}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-primary">تم التحويل بنجاح! ✅</p>
                  <p className="text-sm text-muted-foreground">{numAmount} عملة → {recipientId}</p>
                </motion.div>
              ) : step === 'confirm' ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-4 pb-8 space-y-4"
                >
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-3 border border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المستلم</span>
                      <span className="font-bold text-foreground">{recipientId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المبلغ</span>
                      <span className="font-bold text-foreground">{numAmount} عملة</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رسوم (1%)</span>
                      <span className="font-bold text-foreground">{fee} عملة</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between text-sm">
                      <span className="font-bold text-foreground">الإجمالي</span>
                      <span className="font-black text-primary">{total} عملة</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                      رجوع
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1">
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
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                        placeholder="أدخل معرّف المستخدم"
                        className="pl-9"
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
                        className="pl-9"
                        min={1}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">رصيدك: {currentBalance.toLocaleString()}</span>
                      {numAmount > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          رسوم 1%: {fee} عملة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map(v => (
                      <button
                        key={v}
                        onClick={() => setAmount(String(v))}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border border-border bg-muted/20 hover:border-primary/30 transition-colors text-foreground"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => setStep('confirm')}
                    disabled={!canTransfer}
                    className="w-full h-12 rounded-2xl font-bold text-base"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    متابعة ({total} عملة)
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
