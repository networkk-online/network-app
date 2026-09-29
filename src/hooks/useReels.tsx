import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  duration: number | null;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export const useReels = (currentUserId?: string, filterForFeed?: boolean) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const { toast } = useToast();

  const loadReels = async () => {
    try {
      let query = supabase
        .from('reels')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .order('created_at', { ascending: false })\n        .limit(20);

      // Filter for feed if requested
      if (filterForFeed) {
        query = query.eq('show_in_feed', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReels(data || []);

      // Load user's liked reels
      if (currentUserId) {
        const { data: likes } = await supabase
          .from('reel_likes')
          .select('reel_id')
          .eq('user_id', currentUserId)
          .in('reel_id', (data || []).map(reel => reel.id))
          .limit(100);

        if (likes) {
          setLikedReels(likes.map(like => like.reel_id));
        }
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الريلز',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (reelId: string) => {
    if (!currentUserId) {
      toast({
        title: 'تنبيه',
        description: 'يجب تسجيل الدخول للإعجاب بالريلز',
        variant: 'destructive',
      });
      return;
    }

    const isLiked = likedReels.includes(reelId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('reel_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('reel_id', reelId);

        if (error) throw error;
        setLikedReels(prev => prev.filter(id => id !== reelId));
      } else {
        const { error } = await supabase
          .from('reel_likes')
          .insert({ user_id: currentUserId, reel_id: reelId });

        if (error) throw error;
        setLikedReels(prev => [...prev, reelId]);
      }

      // Update local state
      setReels(prev => prev.map(reel => {
        if (reel.id === reelId) {
          return {
            ...reel,
            likes_count: isLiked ? reel.likes_count - 1 : reel.likes_count + 1
          };
        }
        return reel;
      }));
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الإعجاب',
        variant: 'destructive',
      });
    }
  };

  const incrementViews = async (reelId: string) => {
    try {
      const reel = reels.find(r => r.id === reelId);
      if (reel) {
        await supabase
          .from('reels')
          .update({ views_count: reel.views_count + 1 })
          .eq('id', reelId);
      }
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  useEffect(() => {
    loadReels();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reels'
        },
        () => {
          loadReels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return {
    reels,
    loading,
    likedReels,
    toggleLike,
    incrementViews,
    reload: loadReels
  };
};
