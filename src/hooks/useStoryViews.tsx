import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StoryView {
  id: string;
  user_id: string;
  story_id: string;
  viewed_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export const useStoryViews = (storyId: string) => {
  const [views, setViews] = useState<StoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadViews = async () => {
    try {
      const { data, error } = await supabase
        .from('story_views')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;
      setViews(data || []);
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل المشاهدات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('story_views')
        .insert({
          user_id: user.id,
          story_id: storyId,
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }
    } catch (error: any) {
      console.error('Error recording view:', error);
    }
  };

  useEffect(() => {
    loadViews();

    const channel = supabase
      .channel(`story-views-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_views',
          filter: `story_id=eq.${storyId}`
        },
        () => {
          loadViews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  return {
    views,
    loading,
    recordView,
    reload: loadViews
  };
};
