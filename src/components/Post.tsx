import { Heart, MessageCircle, Send, Bookmark, Mic, Repeat2, MoreHorizontal, DollarSign } from 'lucide-react';
import { PostOptionsDrawer } from './PostOptionsDrawer';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceMessage } from './VoiceMessage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentSection } from '@/components/CommentSection';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useRepost } from '@/hooks/useRepost';
import { PremiumShareSheet } from '@/components/PremiumShareSheet';
import { TipDialog } from '@/components/TipDialog';


interface PostProps {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  isVerified?: boolean;
  image?: string;
  caption: string;
  likes: number;
  commentsCount?: number;
  timeAgo: string;
  walletEarnings: number;
  voiceUrl?: string;
  voiceDuration?: number;
}

const Post = ({ id, userId, username, userAvatar, isVerified = false, image, caption, likes, commentsCount = 0, timeAgo, walletEarnings, voiceUrl, voiceDuration }: PostProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const { isSaved, loading: saveLoading, toggleSave } = useSavedPosts(id);
  const { isReposted, repostCount, loading: repostLoading, toggleRepost } = useRepost(id);

  useEffect(() => {
    checkUser();
    checkIfLiked();
    loadComments();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const checkIfLiked = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false })
      .limit(3);

    setComments(data || []);
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك للإعجاب بالمنشورات",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', currentUser.id);
        
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: currentUser.id
          });
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الإعجاب",
        variant: "destructive"
      });
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك للتعليق",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: currentUser.id,
          content: comment.trim()
        });

      setComment('');
      await loadComments();
      
      toast({
        title: "تم التعليق",
        description: "تم إضافة تعليقك بنجاح",
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة التعليق",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceComment = (audioBlob: Blob, duration: number) => {
    setShowVoiceRecorder(false);
    toast({
      title: "تم إضافة التعليق الصوتي",
      description: `المدة: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
    });
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك لحفظ المنشورات",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const result = await toggleSave();
    if (result?.success) {
      toast({
        title: result.action === 'saved' ? "تم الحفظ" : "تم إلغاء الحفظ",
        description: result.action === 'saved' ? "تم حفظ المنشور بنجاح" : "تم إلغاء حفظ المنشور",
      });
    } else if (result?.error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المنشور",
        variant: "destructive"
      });
    }
  };

  const handleRepost = async () => {
    if (!currentUser) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك لإعادة النشر",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const result = await toggleRepost();
    if (result?.success) {
      toast({
        title: result.action === 'reposted' ? "تمت إعادة النشر" : "تم إلغاء إعادة النشر",
        description: result.action === 'reposted' ? "تم إعادة نشر المنشور على صفحتك" : "تم إلغاء إعادة النشر",
      });
    } else if (result?.error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة النشر",
        variant: "destructive"
      });
    }
  };

  // Get share URL for post
  const getShareUrl = () => {
    return `${window.location.origin}/post/${id}`;
  };

  const getShareText = () => {
    return caption || 'شاهد هذا المنشور الرائع!';
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك للمراسلة",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (currentUser.id === userId) {
      toast({
        title: "لا يمكن مراسلة نفسك",
        description: "لا يمكنك إرسال رسالة لنفسك",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      // Check for existing conversation or create new one
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      let conversationId = null;

      if (existingParticipations) {
        for (const part of existingParticipations) {
          const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', part.conversation_id)
            .eq('user_id', userId)
            .maybeSingle();

          if (otherPart) {
            conversationId = part.conversation_id;
            break;
          }
        }
      }

      if (!conversationId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: currentUser.id },
            { conversation_id: newConv.id, user_id: userId }
          ]);

        conversationId = newConv.id;
      }

      navigate('/messages');
      toast({
        title: "تم فتح المحادثة",
        description: "يمكنك الآن المراسلة",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح المحادثة",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="glass-card mb-5">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate(`/profile/${userId}`)}
        >
          <img 
            src={userAvatar} 
            alt={username}
            className="w-10 h-10 rounded-full object-cover ring-[1.5px] ring-white/10 transition-all group-hover:ring-white/20"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-white/95 text-sm tracking-wide">{username}</p>
              {isVerified && <VerifiedBadge size="sm" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/35">
              <span>{timeAgo}</span>
              <span className="text-primary/60">+${walletEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-1.5 rounded-full hover:bg-white/[0.04] interactive-element"
          onClick={() => setShowOptionsDrawer(true)}
        >
          <MoreHorizontal className="w-5 h-5 text-white/30" strokeWidth={1.4} />
        </Button>
      </div>

      {/* Post Content */}
      {voiceUrl ? (
        <div className="p-6 flex items-center justify-center mx-4 my-2 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <VoiceMessage 
            audioUrl={voiceUrl}
            duration={voiceDuration || 0}
            isOwn={false}
          />
        </div>
      ) : image ? (
        <div className="relative mx-4 my-2 rounded-2xl overflow-hidden">
          <img 
            src={image} 
            alt="Post content"
            className="w-full h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          {/* Glass edge overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" 
               style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }} />
        </div>
      ) : null}

      {/* Post Actions */}
      <div className="px-5 pb-4 pt-3 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent interactive-element"
              onClick={handleLike}
            >
              <Heart 
                className={`w-[22px] h-[22px] transition-all duration-300 ${
                  isLiked 
                    ? 'fill-destructive text-destructive scale-110' 
                    : 'text-white/50 hover:text-destructive'
                }`} 
                strokeWidth={1.4}
              />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent interactive-element"
              onClick={() => setShowCommentsModal(true)}
            >
              <MessageCircle className="w-[22px] h-[22px] text-white/50 hover:text-white/80 transition-colors" strokeWidth={1.4} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent interactive-element"
              onClick={handleRepost}
              disabled={repostLoading}
            >
              <Repeat2 
                className={`w-[22px] h-[22px] transition-all duration-200 ${
                  isReposted ? 'text-primary' : 'text-white/50 hover:text-primary'
                } ${repostLoading ? 'opacity-50' : ''}`} 
                strokeWidth={1.4}
              />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent interactive-element"
              onClick={() => setShowShareMenu(true)}
            >
              <Send className="w-[22px] h-[22px] text-white/50 hover:text-primary transition-colors" strokeWidth={1.4} />
            </Button>
            {currentUser?.id !== userId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 hover:bg-transparent interactive-element"
                onClick={() => setShowTipDialog(true)}
              >
                <DollarSign className="w-[22px] h-[22px] text-primary/50 hover:text-primary transition-colors" strokeWidth={1.4} />
              </Button>
            )}
          </div>
          <Button
            variant="ghost" 
            size="sm" 
            className="p-0 hover:bg-transparent interactive-element"
            onClick={handleSave}
            disabled={saveLoading}
          >
            <Bookmark 
              className={`w-[22px] h-[22px] transition-all duration-200 ${
                isSaved 
                  ? 'fill-white/80 text-white/80' 
                  : 'text-white/50 hover:text-white/80'
              }`} 
              strokeWidth={1.4}
            />
          </Button>
        </div>

        {/* Likes & Reposts */}
        <div className="flex items-center gap-4 mb-2">
          <p className="text-sm font-medium">
            <span className="text-white/90">{likeCount.toLocaleString()}</span>
            <span className="text-white/30 ml-1">إعجاب</span>
          </p>
          {repostCount > 0 && (
            <p className="text-sm font-medium">
              <span className="text-white/90">{repostCount.toLocaleString()}</span>
              <span className="text-white/30 ml-1">إعادة نشر</span>
            </p>
          )}
        </div>

        {/* Caption */}
        <div className="mb-2">
          <span className="font-semibold text-white/90 text-sm mr-2">{username}</span>
          <span className="text-white/60 text-sm">{caption}</span>
        </div>

        {/* Comments Section */}
        {commentsCount > 0 && (
          <div className="mb-3">
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground text-sm hover:text-foreground/80 transition-colors"
            >
              عرض جميع التعليقات ({commentsCount})
            </button>
            {showComments && comments.length > 0 && (
              <div className="mt-2 space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-semibold text-foreground mr-2">
                      {c.profiles?.username || c.profiles?.full_name || 'مستخدم'}
                    </span>
                    <span className="text-foreground/80">{c.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Comment */}
        <div className="pt-3 border-t border-white/[0.04]">
          {showVoiceRecorder ? (
            <VoiceRecorder 
              onRecordingComplete={handleVoiceComment}
              maxDuration={60}
            />
          ) : (
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                placeholder="أضف تعليق..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) handleComment();
                }}
                disabled={isSubmitting}
                className="flex-1 bg-transparent text-white/80 placeholder-white/20 outline-none text-sm"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-primary p-0 interactive-element"
                onClick={() => setShowVoiceRecorder(true)}
                disabled={isSubmitting}
              >
                <Mic className="w-5 h-5 text-white/30" strokeWidth={1.4} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80 text-sm font-semibold p-0"
                onClick={handleComment}
                disabled={!comment.trim() || isSubmitting}
              >
                {isSubmitting ? 'جاري النشر...' : 'نشر'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-2xl h-[600px] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>التعليقات</DialogTitle>
          </DialogHeader>
          <CommentSection type="post" itemId={id} />
        </DialogContent>
      </Dialog>

      {/* Premium Share Sheet - Instagram-style */}
      <PremiumShareSheet
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        content={{
          type: 'post',
          thumbnailUrl: image,
          creatorName: username,
          creatorAvatar: userAvatar,
          caption: caption,
          id: id
        }}
        shareUrl={getShareUrl()}
      />

      {/* Post Options Drawer - IG Style */}
      <PostOptionsDrawer
        isOpen={showOptionsDrawer}
        onClose={() => setShowOptionsDrawer(false)}
        postId={id}
        userId={userId}
        currentUserId={currentUser?.id}
        onPostDeleted={() => window.location.reload()}
      />

      {/* Tip Dialog */}
      <TipDialog
        isOpen={showTipDialog}
        onClose={() => setShowTipDialog(false)}
        postId={id}
        creatorId={userId}
        creatorName={username}
        creatorAvatar={userAvatar}
      />
    </div>
  );
};

export default Post;