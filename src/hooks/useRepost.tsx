import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRepost = (postId: string) => {
  const [isReposted, setIsReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkRepostStatus();
    loadRepostCount();
  }, [postId]);

  const checkRepostStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('reposts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsReposted(!!data);
  };

  const loadRepostCount = async () => {
    const { count } = await supabase
      .from('reposts')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    setRepostCount(count || 0);
  };

  const toggleRepost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'not_authenticated' };
    }

    setLoading(true);
    try {
      if (isReposted) {
        const { error } = await supabase
          .from('reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setIsReposted(false);
        setRepostCount(prev => Math.max(0, prev - 1));
        return { success: true, action: 'removed' };
      } else {
        const { error } = await supabase
          .from('reposts')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        
        setIsReposted(true);
        setRepostCount(prev => prev + 1);
        return { success: true, action: 'reposted' };
      }
    } catch (error: any) {
      console.error('Error toggling repost:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { isReposted, repostCount, loading, toggleRepost };
};
