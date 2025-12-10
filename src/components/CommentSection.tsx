import { useState } from 'react';
import { useComments, Comment } from '@/hooks/useComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Trash2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface CommentSectionProps {
  type: 'post' | 'reel';
  itemId: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string, username: string) => void;
  level?: number;
}

const CommentItem = ({ comment, currentUserId, onDelete, onReply, level = 0 }: CommentItemProps) => {
  const [showReplies, setShowReplies] = useState(true);

  return (
    <div className={`flex gap-3 ${level > 0 ? 'mr-8 mt-3' : ''}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url || ''} />
        <AvatarFallback>
          {comment.profiles?.username?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {comment.profiles?.username || 'مستخدم'}
          </span>
          {comment.profiles?.is_verified && <VerifiedBadge size="sm" />}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: ar,
            })}
          </span>
        </div>
        <p className="text-sm text-foreground">{comment.content}</p>
        <div className="flex items-center gap-4 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id, comment.profiles?.username || 'مستخدم')}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="w-3 h-3 ml-1" />
            رد
          </Button>
          {comment.replies && comment.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplies(!showReplies)}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              {showReplies ? 'إخفاء' : 'عرض'} الردود ({comment.replies.length})
            </Button>
          )}
          {currentUserId === comment.user_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(comment.id)}
              className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
            >
              <Trash2 className="w-3 h-3 ml-1" />
              حذف
            </Button>
          )}
        </div>
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 mt-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onReply={onReply}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentSection = ({ type, itemId }: CommentSectionProps) => {
  const { comments, loading, addComment, deleteComment } = useComments(type, itemId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  });

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    await addComment(newComment, replyingTo?.id);
    setNewComment('');
    setReplyingTo(null);
    setSubmitting(false);
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onDelete={deleteComment}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>الرد على @{replyingTo.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-auto p-0 text-xs"
            >
              إلغاء
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? 'اكتب رداً...' : 'اكتب تعليقاً...'}
            rows={2}
            className="resize-none"
            disabled={submitting}
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            size="icon"
            className="h-auto"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
