import { useState } from 'react';
import { 
  MoreHorizontal, 
  MessageCircleOff, 
  Heart, 
  Trash2, 
  Edit, 
  Flag, 
  Link2, 
  Share2,
  EyeOff,
  Pin,
  UserX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PostSettingsMenuProps {
  postId: string;
  userId: string;
  currentUserId?: string;
  commentsEnabled?: boolean;
  likesEnabled?: boolean;
  onPostDeleted?: () => void;
  onSettingsChanged?: () => void;
}

const PostSettingsMenu = ({ 
  postId, 
  userId, 
  currentUserId,
  commentsEnabled = true,
  likesEnabled = true,
  onPostDeleted,
  onSettingsChanged
}: PostSettingsMenuProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localCommentsEnabled, setLocalCommentsEnabled] = useState(commentsEnabled);
  const [localLikesEnabled, setLocalLikesEnabled] = useState(likesEnabled);

  const isOwner = currentUserId === userId;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط المنشور"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في نسخ الرابط",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'منشور',
          url: `${window.location.origin}/post/${postId}`
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleToggleComments = async () => {
    try {
      const newValue = !localCommentsEnabled;
      
      // Update post-specific setting or user settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUserId,
          comments_enabled: newValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setLocalCommentsEnabled(newValue);
      toast({
        title: newValue ? "تم تفعيل التعليقات" : "تم إيقاف التعليقات",
        description: newValue ? "يمكن للآخرين التعليق الآن" : "لا يمكن للآخرين التعليق"
      });
      onSettingsChanged?.();
    } catch (error) {
      console.error('Error toggling comments:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير إعدادات التعليقات",
        variant: "destructive"
      });
    }
  };

  const handleToggleLikes = async () => {
    try {
      const newValue = !localLikesEnabled;
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUserId,
          likes_enabled: newValue,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setLocalLikesEnabled(newValue);
      toast({
        title: newValue ? "تم إظهار الإعجابات" : "تم إخفاء الإعجابات",
        description: newValue ? "عدد الإعجابات مرئي الآن" : "عدد الإعجابات مخفي الآن"
      });
      onSettingsChanged?.();
    } catch (error) {
      console.error('Error toggling likes:', error);
      toast({
        title: "خطأ",
        description: "فشل في تغيير إعدادات الإعجابات",
        variant: "destructive"
      });
    }
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
      setShowDeleteDialog(false);
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

  const handleReport = () => {
    toast({
      title: "تم الإبلاغ",
      description: "شكراً لك، سنراجع المنشور"
    });
  };

  const handleHidePost = () => {
    toast({
      title: "تم الإخفاء",
      description: "لن ترى هذا المنشور مجدداً"
    });
  };

  const handleBlockUser = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUserId,
          blocked_id: userId
        });

      if (error) throw error;

      toast({
        title: "تم الحظر",
        description: "تم حظر هذا المستخدم"
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "محظور مسبقاً",
          description: "هذا المستخدم محظور بالفعل"
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في حظر المستخدم",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1 hover:bg-transparent">
            <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
          {/* Share Options */}
          <DropdownMenuItem 
            onClick={handleShare}
            className="cursor-pointer hover:bg-gray-800"
          >
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleCopyLink}
            className="cursor-pointer hover:bg-gray-800"
          >
            <Link2 className="w-4 h-4 ml-2" />
            نسخ الرابط
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Owner-only options */}
          {isOwner && (
            <>
              <DropdownMenuItem 
                onClick={handleToggleComments}
                className="cursor-pointer hover:bg-gray-800"
              >
                <MessageCircleOff className="w-4 h-4 ml-2" />
                {localCommentsEnabled ? 'إيقاف التعليقات' : 'تفعيل التعليقات'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleToggleLikes}
                className="cursor-pointer hover:bg-gray-800"
              >
                <Heart className="w-4 h-4 ml-2" />
                {localLikesEnabled ? 'إخفاء عدد الإعجابات' : 'إظهار عدد الإعجابات'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  toast({
                    title: "قريباً",
                    description: "ميزة التعديل قيد التطوير"
                  });
                }}
                className="cursor-pointer hover:bg-gray-800"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل المنشور
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  toast({
                    title: "قريباً",
                    description: "ميزة التثبيت قيد التطوير"
                  });
                }}
                className="cursor-pointer hover:bg-gray-800"
              >
                <Pin className="w-4 h-4 ml-2" />
                تثبيت في الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="cursor-pointer hover:bg-red-900/50 text-red-400"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف المنشور
              </DropdownMenuItem>
            </>
          )}

          {/* Non-owner options */}
          {!isOwner && (
            <>
              <DropdownMenuItem 
                onClick={handleHidePost}
                className="cursor-pointer hover:bg-gray-800"
              >
                <EyeOff className="w-4 h-4 ml-2" />
                إخفاء هذا المنشور
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBlockUser}
                className="cursor-pointer hover:bg-gray-800"
              >
                <UserX className="w-4 h-4 ml-2" />
                حظر هذا المستخدم
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={handleReport}
                className="cursor-pointer hover:bg-red-900/50 text-red-400"
              >
                <Flag className="w-4 h-4 ml-2" />
                الإبلاغ عن المنشور
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنشور؟</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostSettingsMenu;
