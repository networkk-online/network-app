import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export const useComments = (type: 'post' | 'reel', itemId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const tableName = type === 'post' ? 'comments' : 'reel_comments';
  const idField = type === 'post' ? 'post_id' : 'reel_id';

  const loadComments = async () => {
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(idField, itemId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Then get profiles for each comment
      if (commentsData && commentsData.length > 0) {
        const userIds = commentsData.map((c: any) => c.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);
        
        const commentsWithProfiles = commentsData.map((comment: any) => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || null
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل تحميل التعليقات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول للتعليق',
          variant: 'destructive',
        });
        return;
      }

      const commentData: any = {
        user_id: user.id,
        content,
      };
      commentData[idField] = itemId;

      const { error } = await supabase
        .from(tableName as any)
        .insert(commentData);

      if (error) throw error;

      toast({
        title: 'تم',
        description: 'تم إضافة التعليق',
      });

      loadComments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل إضافة التعليق',
        variant: 'destructive',
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'تم',
        description: 'تم حذف التعليق',
      });

      loadComments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف التعليق',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadComments();

    const channel = supabase
      .channel(`${tableName}-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `${idField}=eq.${itemId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    reload: loadComments
  };
};
