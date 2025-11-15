import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Send, Sparkles } from 'lucide-react';

interface DonationReplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  donation: {
    id: string;
    donor_user_id: string;
    creator_user_id: string;
    amount: number;
    donor_username: string;
    message?: string;
  };
}

const quickReplies = [
  "شكراً جزيلاً على دعمك! يعني لي الكثير 💖",
  "أنت رائع! شكراً على دعمك المستمر 🌟",
  "دعمك يعطيني طاقة للإبداع أكثر! شكراً 🚀",
  "ممتن جداً لك! شكراً من القلب ❤️",
  "هذا الدعم يشجعني على الاستمرار! شكراً 🙏"
];

export const DonationReplyDialog = ({ isOpen, onClose, donation }: DonationReplyDialogProps) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast({
        title: "رسالة فارغة",
        description: "يرجى كتابة رسالة شكر",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('donation_replies')
        .insert({
          donation_id: donation.id,
          creator_user_id: donation.creator_user_id,
          donor_user_id: donation.donor_user_id,
          reply_message: replyMessage
        });

      if (error) throw error;

      // Create notification for donor
      await supabase
        .from('notifications')
        .insert({
          user_id: donation.donor_user_id,
          actor_id: donation.creator_user_id,
          type: 'donation_reply',
          content: JSON.stringify({
            donation_id: donation.id,
            reply_message: replyMessage
          })
        });

      toast({
        title: "تم إرسال الرد! 💌",
        description: `تم إرسال رسالة الشكر إلى ${donation.donor_username}`,
      });

      setReplyMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرد",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    setReplyMessage(reply);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            رد على الدعم
          </DialogTitle>
          <DialogDescription>
            <div className="mt-3 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{donation.donor_username}</span>
                <span className="text-xl font-bold text-yellow-500">${donation.amount.toFixed(2)}</span>
              </div>
              {donation.message && (
                <p className="text-sm text-muted-foreground italic">"{donation.message}"</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">رسالة الشكر</label>
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="اكتب رسالة شكر للمتبرع..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {replyMessage.length}/500 حرف
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              ردود سريعة
            </label>
            <div className="grid gap-2">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  className="text-right justify-start text-xs h-auto py-2"
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSendReply} 
            disabled={isSending || !replyMessage.trim()}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'جاري الإرسال...' : 'إرسال'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
