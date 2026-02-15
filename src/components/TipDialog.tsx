import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, X, Heart, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

export const TipDialog = ({ isOpen, onClose, postId, creatorId, creatorName, creatorAvatar }: TipDialogProps) => {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const finalAmount = selectedAmount || (customAmount ? Number(customAmount) : 0);

  const handleSendTip = async () => {
    if (!finalAmount || finalAmount <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'يجب تسجيل الدخول', variant: 'destructive' });
      return;
    }

    if (user.id === creatorId) {
      toast({ title: 'لا يمكنك إرسال إكرامية لنفسك', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('post_tips').insert({
        post_id: postId,
        tipper_id: user.id,
        creator_id: creatorId,
        amount: finalAmount,
        message: message.trim() || null,
      });

      if (error) throw error;

      toast({ title: '💚 تم إرسال الإكرامية!', description: `تم إرسال ${finalAmount} IQD إلى ${creatorName}` });
      onClose();
      setSelectedAmount(null);
      setCustomAmount('');
      setMessage('');
    } catch (error: any) {
      console.error('Tip error:', error);
      toast({ title: 'خطأ', description: 'فشل إرسال الإكرامية', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black/95 border-green-500/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            إرسال إكرامية
          </DialogTitle>
        </DialogHeader>

        {/* Creator info */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <img src={creatorAvatar} alt={creatorName} className="w-10 h-10 rounded-full object-cover border border-green-500/50" />
          <div>
            <p className="text-white font-semibold text-sm">{creatorName}</p>
            <p className="text-gray-400 text-xs">سيحصل على 80% من المبلغ</p>
          </div>
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-3 gap-2">
          {TIP_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              whileTap={{ scale: 0.95 }}
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
          {/* Custom amount */}
          <input
            type="number"
            placeholder="مبلغ آخر"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            className="py-3 rounded-xl text-sm text-center bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-green-500/50"
          />
        </div>

        {/* Message */}
        <input
          type="text"
          placeholder="رسالة مع الإكرامية (اختياري)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-green-500/50"
          dir="auto"
        />

        {/* Send button */}
        <Button
          onClick={handleSendTip}
          disabled={!finalAmount || finalAmount <= 0 || sending}
          className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl disabled:opacity-40"
        >
          {sending ? 'جاري الإرسال...' : (
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
