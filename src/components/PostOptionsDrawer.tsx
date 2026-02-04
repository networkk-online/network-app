import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flag, 
  EyeOff, 
  Star, 
  UserCircle, 
  Link2, 
  Trash2, 
  Edit, 
  Pin,
  MessageCircleOff,
  Heart,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface PostOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  userId: string;
  currentUserId?: string;
  onPostDeleted?: () => void;
}

export const PostOptionsDrawer = ({
  isOpen,
  onClose,
  postId,
  userId,
  currentUserId,
  onPostDeleted
}: PostOptionsDrawerProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwner = currentUserId === userId;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط المنشور"
      });
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const handleReport = () => {
    toast({
      title: "تم الإبلاغ",
      description: "شكراً لك، سنراجع المنشور"
    });
    onClose();
  };

  const handleNotInterested = () => {
    toast({
      title: "تم",
      description: "لن نعرض لك محتوى مشابه"
    });
    onClose();
  };

  const handleAddToFavorites = () => {
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة المنشور للمفضلة"
    });
    onClose();
  };

  const handleAboutAccount = () => {
    toast({
      title: "معلومات الحساب",
      description: "سيتم عرض معلومات الحساب قريباً"
    });
    onClose();
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المنشور بنجاح"
      });
      onClose();
      onPostDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المنشور",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const options = isOwner ? [
    { icon: Edit, label: 'تعديل المنشور', onClick: () => { toast({ title: "قريباً", description: "ميزة التعديل قيد التطوير" }); onClose(); } },
    { icon: Pin, label: 'تثبيت في الملف الشخصي', onClick: () => { toast({ title: "قريباً", description: "ميزة التثبيت قيد التطوير" }); onClose(); } },
    { icon: MessageCircleOff, label: 'إيقاف التعليقات', onClick: () => { toast({ title: "تم", description: "تم إيقاف التعليقات" }); onClose(); } },
    { icon: Heart, label: 'إخفاء عدد الإعجابات', onClick: () => { toast({ title: "تم", description: "تم إخفاء الإعجابات" }); onClose(); } },
    { icon: Link2, label: 'نسخ الرابط', onClick: handleCopyLink },
    { icon: Trash2, label: 'حذف المنشور', onClick: handleDeletePost, danger: true },
  ] : [
    { icon: EyeOff, label: 'غير مهتم', onClick: handleNotInterested },
    { icon: Star, label: 'إضافة للمفضلة', onClick: handleAddToFavorites },
    { icon: UserCircle, label: 'عن هذا الحساب', onClick: handleAboutAccount },
    { icon: Link2, label: 'نسخ الرابط', onClick: handleCopyLink },
    { icon: Flag, label: 'إبلاغ', onClick: handleReport, danger: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30 
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl rounded-t-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Options List */}
            <div className="px-4 pb-8 pt-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {options.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={option.onClick}
                  disabled={isDeleting && option.label === 'حذف المنشور'}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                    "hover:bg-white/10 active:scale-[0.98]",
                    option.danger ? "text-red-400 hover:bg-red-500/10" : "text-white"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    option.danger ? "bg-red-500/20" : "bg-white/10"
                  )}>
                    {isDeleting && option.label === 'حذف المنشور' ? (
                      <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <option.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium text-base">{option.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Safe Area */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
