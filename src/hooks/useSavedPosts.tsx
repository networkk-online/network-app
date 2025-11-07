import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSavedPosts = (postId?: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (postId) {
      checkIfSaved();
    }
  }, [postId]);

  const checkIfSaved = async () => {
    if (!postId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsSaved(!!data);
  };

  const toggleSave = async () => {
    if (!postId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    setLoading(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
        return { success: true, action: 'unsaved' };
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setIsSaved(true);
        return { success: true, action: 'saved' };
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { isSaved, loading, toggleSave, checkIfSaved };
};
