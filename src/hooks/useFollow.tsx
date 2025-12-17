import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId?: string) => {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      checkFollowStatus();
    }
  }, [currentUserId, targetUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = useCallback(async () => {
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

    // Optimistic update - update UI immediately
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setLoading(true);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;

        toast({
          title: 'تم إلغاء المتابعة',
          description: 'تم إلغاء المتابعة بنجاح',
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        if (error) throw error;

        toast({
          title: 'تمت المتابعة',
          description: 'تم متابعة المستخدم بنجاح',
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      console.error('Error toggling follow:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث المتابعة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId, isFollowing, toast]);

  return {
    isFollowing,
    loading,
    toggleFollow,
    isOwnProfile: currentUserId === targetUserId,
  };
};
