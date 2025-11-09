import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  replies_count: number;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  };
  replies?: Comment[];
}

export const useComments = (type: 'post' | 'reel', itemId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const tableName = type === 'post' ? 'comments' : 'reel_comments';
  const idField = type === 'post' ? 'post_id' : 'reel_id';

  const loadComments = async () => {
    try {
      // Get all comments (including replies)
      const { data: commentsData, error: commentsError } = await supabase
        .from(tableName as any)
        .select('*')
        .eq(idField, itemId)
        .order('created_at', { ascending: true });

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
          profiles: profilesMap.get(comment.user_id) || null,
          replies: []
        }));

        // Build nested structure
        const topLevelComments: Comment[] = [];
        const commentsMap = new Map<string, Comment>();

        // First pass: create map of all comments
        commentsWithProfiles.forEach((comment: Comment) => {
          commentsMap.set(comment.id, comment);
        });

        // Second pass: build hierarchy
        commentsWithProfiles.forEach((comment: Comment) => {
          if (comment.parent_id) {
            const parent = commentsMap.get(comment.parent_id);
            if (parent) {
              if (!parent.replies) parent.replies = [];
              parent.replies.push(comment);
            }
          } else {
            topLevelComments.push(comment);
          }
        });

        setComments(topLevelComments);
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

  const addComment = async (content: string, parentId?: string) => {
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
        parent_id: parentId || null,
      };
      commentData[idField] = itemId;

      const { error } = await supabase
        .from(tableName as any)
        .insert(commentData);

      if (error) throw error;

      toast({
        title: 'تم',
        description: parentId ? 'تم إضافة الرد' : 'تم إضافة التعليق',
      });

      loadComments();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: parentId ? 'فشل إضافة الرد' : 'فشل إضافة التعليق',
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
