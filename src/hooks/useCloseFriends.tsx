import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCloseFriends = (userId?: string) => {
  const { toast } = useToast();
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && userId && currentUserId !== userId) {
      checkCloseFriendStatus();
    }
  }, [currentUserId, userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const checkCloseFriendStatus = async () => {
    if (!currentUserId || !userId) return;

    try {
      const { data, error } = await supabase
        .from('close_friends')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('friend_id', userId)
        .maybeSingle();

      if (!error && data) {
        setIsCloseFriend(true);
      } else {
        setIsCloseFriend(false);
      }
    } catch (error) {
      console.error('Error checking close friend status:', error);
    }
  };

  const toggleCloseFriend = async () => {
    if (!currentUserId) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    if (!userId || currentUserId === userId) {
      return;
    }

    setLoading(true);
    try {
      if (isCloseFriend) {
        const { error } = await supabase
          .from('close_friends')
          .delete()
          .eq('user_id', currentUserId)
          .eq('friend_id', userId);

        if (error) throw error;

        setIsCloseFriend(false);
        toast({
          title: 'تمت الإزالة',
          description: 'تم إزالة المستخدم من قائمة الأصدقاء المقربين',
        });
      } else {
        const { error } = await supabase
          .from('close_friends')
          .insert({
            user_id: currentUserId,
            friend_id: userId,
          });

        if (error) throw error;

        setIsCloseFriend(true);
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة المستخدم إلى قائمة الأصدقاء المقربين',
        });
      }
    } catch (error: any) {
      console.error('Error toggling close friend:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث القائمة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isCloseFriend,
    loading,
    toggleCloseFriend,
    isOwnProfile: currentUserId === userId,
  };
};
