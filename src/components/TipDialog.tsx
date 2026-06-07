import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Send, Loader2 } from 'lucide-react';
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

const TIP_AMOUNTS = [500, 1000, 2500, 5000, 10000];

interface SendTipResult {
  success: boolean;
  error?: string;
  new_balance?: number;
}

export const TipDialog = ({ isOpen, onClose, creatorId, creatorName, creatorAvatar }: TipDialogProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const finalAmount = selectedAmount || (customAmount ? Number(customAmount) : 0);

  const resetAndClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    onClose();
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
      const { data, error } = await supabase.rpc('send_tip' as any, {
        sender_id: user.id,
        receiver_id: creatorId,
        tip_amount: finalAmount,
        tip_message: message.trim() || null,
      });

      const result = data as SendTipResult | null;

      if (error || !result?.success) {
        if (result?.error === 'insufficient_balance') {
          toast.error('رصيدك الحالي غير كافي لإتمام عملية الإرسال.');
        } else if (result?.error === 'cannot_tip_self') {
          toast.error('لا يمكنك إرسال إكرامية لنفسك');
        } else if (result?.error === 'invalid_amount') {
          toast.error('قيمة الإكرامية غير صحيحة');
        } else {
          toast.error('رصيدك الحالي غير كافي لإتمام عملية الإرسال.');
        }
        return;
      }

      toast.success('تم إرسال الإكرامية بنجاح', {
        description: `${finalAmount.toLocaleString()} IQD إلى ${creatorName}`,
      });
      resetAndClose();
    } catch (e) {
      console.error('Tip error:', e);
      toast.error('رصيدك الحالي غير كافي لإتمام عملية الإرسال.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="bg-black/95 border-green-500/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            إرسال إكرامية
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <img src={creatorAvatar} alt={creatorName} className="w-10 h-10 rounded-full object-cover border border-green-500/50" />
          <div>
            <p className="text-white font-semibold text-sm">{creatorName}</p>
            <p className="text-gray-400 text-xs">سيحصل على المبلغ كاملاً في محفظته</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TIP_AMOUNTS.map((amount) => (
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
              {amount.toLocaleString()} IQD
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
              إرسال {finalAmount > 0 ? `${finalAmount.toLocaleString()} IQD` : ''}
            </span>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
