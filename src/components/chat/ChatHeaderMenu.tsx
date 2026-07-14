import { useNavigate } from 'react-router-dom';
import { MoreVertical, Ban, Trash2, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBlockUser } from '@/hooks/useBlockUser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderMenuProps {
  otherUser: { id?: string; username?: string; full_name?: string; avatar_url?: string | null };
  conversationId: string | null;
  currentUserId?: string;
  onDeleted?: () => void;
}

export const ChatHeaderMenu = ({
  otherUser,
  conversationId,
  currentUserId,
  onDeleted,
}: ChatHeaderMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isBlocked, toggleBlock } = useBlockUser(otherUser?.id);

  const handleDelete = async () => {
    if (!conversationId || !currentUserId) return;
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);

    if (error) {
      toast({ title: 'خطأ', description: 'تعذّر حذف المحادثة', variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الحذف', description: 'تم حذف المحادثة من قائمتك' });
    onDeleted?.();
  };

  const handleViewProfile = () => {
    if (otherUser?.id) navigate(`/profile/${otherUser.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          aria-label="خيارات المحادثة"
        >
          <MoreVertical className="h-5 w-5 text-white/70" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-black/95 backdrop-blur-xl border-white/10 text-white">
        <DropdownMenuItem onClick={handleViewProfile} className="gap-2 cursor-pointer focus:bg-white/10">
          <UserIcon className="w-4 h-4" />
          عرض الملف الشخصي
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={toggleBlock} className="gap-2 cursor-pointer focus:bg-white/10">
          <Ban className="w-4 h-4" />
          {isBlocked ? 'إلغاء حظر المستخدم' : 'حظر المستخدم'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
          حذف المحادثة
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
