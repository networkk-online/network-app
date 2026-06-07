import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, Send, Loader2, Banknote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
}

const GEM_AMOUNTS = [500, 1000, 2500, 5000, 10000];
const CASH_AMOUNTS = [500, 1000, 2500, 5000, 10000];

type Currency = 'gems' | 'cash';

interface SendTipResult {
  success: boolean;
  error?: string;
  new_balance?: number;
  currency?: string;
}

export const TipDialog = ({ isOpen, onClose, creatorId, creatorName, creatorAvatar }: TipDialogProps) => {
  const [currency, setCurrency] = useState<Currency>('gems');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const finalAmount = selectedAmount || (customAmount ? Number(customAmount) : 0);
  const amounts = currency === 'gems' ? GEM_AMOUNTS : CASH_AMOUNTS;
  const unit = currency === 'gems' ? '💎' : 'IQD';

  const resetAndClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    onClose();
  };

  const switchCurrency = (c: Currency) => {
    setCurrency(c);
    setSelectedAmount(null);
    setCustomAmount('');
  };

  const handleSendTip = async () => {
    if (!finalAmount || finalAmount <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return;
    }
    if (user.id === creatorId) {
      toast.error('لا يمكنك إرسال إكرامية لنفسك');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.rpc('send_tip_v2' as any, {
        sender_id: user.id,
        receiver_id: creatorId,
        tip_amount: finalAmount,
        currency_type: currency,
        tip_message: message.trim() || null,
      });

      const result = data as SendTipResult | null;

      if (error || !result?.success) {
        const code = result?.error;
        if (code === 'insufficient_gems') {
          toast.error('رصيد الجواهر الحالي غير كافي لإتمام عملية الإرسال.');
        } else if (code === 'insufficient_cash') {
          toast.error('رصيد الكاش الحالي غير كافي لإتمام عملية الإرسال.');
        } else if (code === 'cannot_tip_self') {
          toast.error('لا يمكنك إرسال إكرامية لنفسك');
        } else if (code === 'invalid_amount') {
          toast.error('قيمة الإكرامية غير صحيحة');
        } else if (code === 'unauthorized') {
          toast.error('غير مصرح بهذه العملية');
        } else {
          toast.error(error?.message || 'فشل إرسال الإكرامية');
        }
        return;
      }

      toast.success('تم إرسال الإكرامية بنجاح', {
        description: `${finalAmount.toLocaleString()} ${unit} إلى ${creatorName}`,
      });
      resetAndClose();
    } catch (e: any) {
      console.error('Tip error:', e);
      toast.error(e?.message || 'حدث خطأ غير متوقع');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="bg-black/95 border-green-500/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <Gem className="w-5 h-5 text-green-400" />
            إرسال إكرامية
          </DialogTitle>
        </DialogHeader>

        {/* Currency toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            type="button"
            disabled={sending}
            onClick={() => switchCurrency('gems')}
            className={cn(
              'py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
              currency === 'gems'
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'text-white/60 hover:text-white'
            )}
          >
            <Gem className="w-3.5 h-3.5" /> جواهر 💎
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => switchCurrency('cash')}
            className={cn(
              'py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
              currency === 'cash'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                : 'text-white/60 hover:text-white'
            )}
          >
            <Banknote className="w-3.5 h-3.5" /> رصيد كاش 💵
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <img src={creatorAvatar} alt={creatorName} className="w-10 h-10 rounded-full object-cover border border-green-500/50" />
          <div>
            <p className="text-white font-semibold text-sm">{creatorName}</p>
            <p className="text-gray-400 text-xs">سيحصل على المبلغ كاملاً في محفظته</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {amounts.map((amount) => (
            <motion.button
              key={amount}
              whileTap={{ scale: 0.95 }}
              disabled={sending}
              onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
              className={cn(
                'py-3 rounded-xl text-sm font-bold transition-all border',
                selectedAmount === amount
                  ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-green-500/50'
              )}
            >
              {amount.toLocaleString()} {unit}
            </motion.button>
          ))}
          <input
            type="number"
            placeholder="مبلغ آخر"
            value={customAmount}
            disabled={sending}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            className="py-3 rounded-xl text-sm text-center bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-green-500/50"
          />
        </div>

        <input
          type="text"
          placeholder="رسالة مع الإكرامية (اختياري)"
          value={message}
          disabled={sending}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-green-500/50"
          dir="auto"
        />

        <Button
          onClick={handleSendTip}
          disabled={!finalAmount || finalAmount <= 0 || sending}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الإرسال...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              إرسال {finalAmount > 0 ? `${finalAmount.toLocaleString()} ${unit}` : ''}
            </span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
