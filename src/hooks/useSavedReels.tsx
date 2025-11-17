import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSavedReels = (reelId?: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reelId) {
      checkIfSaved();
    }
  }, [reelId]);

  const checkIfSaved = async () => {
    if (!reelId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_reels')
      .select('id')
      .eq('reel_id', reelId)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsSaved(!!data);
  };

  const toggleSave = async () => {
    if (!reelId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    setLoading(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_reels')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsSaved(false);
        return { success: true, action: 'unsaved' };
      } else {
        const { error } = await supabase
          .from('saved_reels')
          .insert({
            reel_id: reelId,
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
