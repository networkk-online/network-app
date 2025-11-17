import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBlockUser = (targetUserId?: string) => {
  const { toast } = useToast();
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkBlockStatus();
    }
  }, [currentUserId, targetUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const checkBlockStatus = async () => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

      if (!error && data) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const toggleBlock = async () => {
    if (!currentUserId) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    if (!targetUserId || currentUserId === targetUserId) {
      return;
    }

    setLoading(true);
    try {
      if (isBlocked) {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', targetUserId);

        if (error) throw error;

        setIsBlocked(false);
        toast({
          title: 'تم إلغاء الحظر',
          description: 'تم إلغاء حظر المستخدم بنجاح',
        });
      } else {
        // Block user and unfollow them
        const { error: blockError } = await supabase
          .from('blocked_users')
          .insert({
            blocker_id: currentUserId,
            blocked_id: targetUserId,
          });

        if (blockError) throw blockError;

        // Unfollow automatically
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', targetUserId)
          .eq('following_id', currentUserId);

        setIsBlocked(true);
        toast({
          title: 'تم الحظر',
          description: 'تم حظر المستخدم وإلغاء المتابعة',
        });
      }
    } catch (error: any) {
      console.error('Error toggling block:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث الحظر',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isBlocked,
    loading,
    toggleBlock,
    isOwnProfile: currentUserId === targetUserId,
  };
};
