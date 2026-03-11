import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Share, Feather, X, ArrowRight, TrendingUp, Hash, BadgeCheck, MoreHorizontal, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTweets, Tweet } from '@/hooks/useTweets';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import BackButton from '@/components/BackButton';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import AffiliationBadge from '@/components/AffiliationBadge';
import { useAffiliation } from '@/hooks/useAffiliation';

const MAX_CHARS = 280;

// ─── Trending Section ───
const TrendingSection = () => {
  const trends = [
    { tag: '#نيتورك', count: '12.5K' },
    { tag: '#بغداد', count: '8.2K' },
    { tag: '#العراق', count: '6.1K' },
    { tag: '#تقنية', count: '4.8K' },
    { tag: '#رياضة', count: '3.3K' },
  ];

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[hsl(var(--primary))]" />
        <h3 className="text-foreground font-bold text-base">الأكثر تداولاً</h3>
      </div>
      <div className="space-y-3">
        {trends.map((trend, i) => (
          <motion.div
            key={trend.tag}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[hsl(var(--primary))]/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[hsl(var(--primary))] group-hover:scale-110 transition-transform" />
              <span className="text-foreground text-sm font-medium group-hover:text-[hsl(var(--primary))] transition-colors">
                {trend.tag}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">{trend.count} تغريدة</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Tweet Card ───
const TweetCard = ({
  tweet, isLiked, isRetweeted, onLike, onRetweet, onReply, onQuote,
}: {
  tweet: Tweet;
  isLiked: boolean;
  isRetweeted: boolean;
  onLike: () => void;
  onRetweet: () => void;
  onReply: () => void;
  onQuote: () => void;
}) => {
  const navigate = useNavigate();
  const timeAgo = getTimeAgo(tweet.created_at);

  // Highlight hashtags with neon green
  const renderContent = (text: string) => {
    return text.split(/(#\S+)/g).map((part, i) =>
      part.startsWith('#') ? (
        <span key={i} className="text-[hsl(var(--primary))] font-medium cursor-pointer hover:underline">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.06] transition-all duration-300 group"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar
          className="w-11 h-11 border border-white/10 cursor-pointer shrink-0"
          onClick={() => tweet.profile && navigate(`/profile/${tweet.user_id}`)}
        >
          <AvatarImage src={tweet.profile?.avatar_url || '/default-avatar.jpg'} />
          <AvatarFallback className="bg-card text-foreground text-sm">
            {(tweet.profile?.username || '?')[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-foreground font-semibold text-sm truncate">
              {tweet.profile?.full_name || tweet.profile?.username || 'مستخدم'}
            </span>
            {tweet.profile?.is_verified && <VerifiedBadge size="sm" />}
            <span className="text-muted-foreground text-xs">
              @{tweet.profile?.username || 'user'} · {timeAgo}
            </span>
          </div>

          {/* Content */}
          <p className="text-foreground/90 text-sm mt-1.5 leading-relaxed whitespace-pre-wrap break-words" dir="auto">
            {renderContent(tweet.content)}
          </p>

          {/* Quoted tweet */}
          {tweet.quoted_tweet && (
            <div className="mt-2 p-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-foreground text-xs font-medium">
                  {tweet.quoted_tweet.profile?.username || 'user'}
                </span>
                {tweet.quoted_tweet.profile?.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-foreground/70 text-xs">{tweet.quoted_tweet.content}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 max-w-[320px]">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onReply}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors group/btn"
            >
              <MessageCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="text-xs">{tweet.replies_count || ''}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onRetweet}
              className={`flex items-center gap-1.5 transition-colors group/btn ${
                isRetweeted ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-[hsl(var(--primary))]'
              }`}
            >
              <Repeat2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="text-xs">{tweet.retweets_count || ''}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onLike}
              className={`flex items-center gap-1.5 transition-colors group/btn ${
                isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 group-hover/btn:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{tweet.likes_count || ''}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onQuote}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-[hsl(var(--primary))] transition-colors group/btn"
            >
              <Quote className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Compose Modal ───
const ComposeModal = ({
  open, onClose, onSubmit, replyTo, quoteTweet,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, parentId?: string, quoteId?: string) => Promise<boolean>;
  replyTo?: Tweet | null;
  quoteTweet?: Tweet | null;
}) => {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const remaining = MAX_CHARS - content.length;

  const handleSubmit = async () => {
    if (content.trim().length === 0 || posting) return;
    setPosting(true);
    const success = await onSubmit(content, replyTo?.id, quoteTweet?.id);
    if (success) {
      setContent('');
      onClose();
    }
    setPosting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 backdrop-blur-2xl border-white/[0.08] max-w-lg mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">
            {replyTo ? 'رد على التغريدة' : quoteTweet ? 'اقتباس التغريدة' : 'تغريدة جديدة'}
          </DialogTitle>
        </DialogHeader>

        {replyTo && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-muted-foreground mb-1">
            <span className="text-foreground font-medium">@{replyTo.profile?.username}</span>: {replyTo.content.slice(0, 100)}...
          </div>
        )}

        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder={replyTo ? 'اكتب ردك...' : 'شنو يدور ببالك؟'}
            className="bg-white/[0.04] border-white/[0.08] text-foreground min-h-[120px] resize-none text-sm placeholder:text-muted-foreground focus:border-[hsl(var(--primary))]/50"
            dir="auto"
          />
          <div className={`absolute bottom-3 left-3 text-xs font-mono ${
            remaining < 20 ? 'text-red-400' : remaining < 50 ? 'text-yellow-400' : 'text-muted-foreground'
          }`}>
            {remaining}
          </div>
        </div>

        {quoteTweet && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <span className="text-foreground font-medium">@{quoteTweet.profile?.username}</span>
            <p className="text-muted-foreground mt-1">{quoteTweet.content.slice(0, 120)}</p>
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
          <Button
            onClick={handleSubmit}
            disabled={content.trim().length === 0 || posting}
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/80 text-primary-foreground rounded-full px-6 font-semibold"
          >
            {posting ? 'جارٍ النشر...' : replyTo ? 'رد' : 'غرّد'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Thread View ───
const ThreadView = ({
  tweet, replies, isLiked, isRetweeted, onLike, onRetweet, onReply, onClose, likedTweets, retweetedTweets, onLikeReply, onRetweetReply,
}: {
  tweet: Tweet;
  replies: Tweet[];
  isLiked: boolean;
  isRetweeted: boolean;
  onLike: () => void;
  onRetweet: () => void;
  onReply: () => void;
  onClose: () => void;
  likedTweets: string[];
  retweetedTweets: string[];
  onLikeReply: (id: string) => void;
  onRetweetReply: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-12 pb-4 overflow-y-auto"
  >
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-background border border-white/[0.08] rounded-2xl max-w-lg w-full mx-4"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-foreground font-bold">سلسلة</h3>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
          <X className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </div>

      <div className="p-4">
        <TweetCard
          tweet={tweet}
          isLiked={isLiked}
          isRetweeted={isRetweeted}
          onLike={onLike}
          onRetweet={onRetweet}
          onReply={onReply}
          onQuote={() => {}}
        />
      </div>

      {replies.length > 0 && (
        <div className="border-t border-white/[0.06] p-4 space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium mb-2">الردود</h4>
          {replies.map(reply => (
            <div key={reply.id} className="relative pl-4 border-l-2 border-[hsl(var(--primary))]/30">
              <TweetCard
                tweet={reply}
                isLiked={likedTweets.includes(reply.id)}
                isRetweeted={retweetedTweets.includes(reply.id)}
                onLike={() => onLikeReply(reply.id)}
                onRetweet={() => onRetweetReply(reply.id)}
                onReply={() => {}}
                onQuote={() => {}}
              />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-white/[0.06]">
        <Button onClick={onReply} variant="outline" className="w-full rounded-full border-white/10 text-foreground hover:bg-[hsl(var(--primary))]/10 hover:text-[hsl(var(--primary))]">
          <MessageCircle className="w-4 h-4 mr-2" /> اكتب رداً
        </Button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Page ───
const Tweets = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Tweet | null>(null);
  const [quoteTweet, setQuoteTweet] = useState<Tweet | null>(null);
  const [threadTweet, setThreadTweet] = useState<Tweet | null>(null);
  const [threadReplies, setThreadReplies] = useState<Tweet[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    tweets, loading, hasMore, likedTweets, retweetedTweets,
    fetchMore, postTweet, toggleLike, toggleRetweet, fetchReplies,
  } = useTweets(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchMore();
      }
    }, { threshold: 0.5 });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchMore]);

  const handleReply = (tweet: Tweet) => {
    setReplyTo(tweet);
    setQuoteTweet(null);
    setComposeOpen(true);
  };

  const handleQuote = (tweet: Tweet) => {
    setQuoteTweet(tweet);
    setReplyTo(null);
    setComposeOpen(true);
  };

  const handleOpenThread = async (tweet: Tweet) => {
    setThreadTweet(tweet);
    const replies = await fetchReplies(tweet.id);
    setThreadReplies(replies);
  };

  const handleSubmit = async (content: string, parentId?: string, quoteId?: string) => {
    return await postTweet(content, parentId, quoteId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <BackButton />
          <h1 className="text-foreground font-bold text-lg">التغريدات</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="pt-14 pb-24 max-w-4xl mx-auto flex gap-6 px-4">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl">
          {/* Feed */}
          <div className="space-y-3 mt-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-11 h-11 rounded-full bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 bg-white/[0.06]" />
                      <Skeleton className="h-3 w-full bg-white/[0.06]" />
                      <Skeleton className="h-3 w-3/4 bg-white/[0.06]" />
                    </div>
                  </div>
                </div>
              ))
            ) : tweets.length === 0 ? (
              <div className="text-center py-16">
                <Feather className="w-12 h-12 text-[hsl(var(--primary))]/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">لا توجد تغريدات بعد</p>
                <p className="text-muted-foreground text-xs mt-1">كن أول من يغرد!</p>
              </div>
            ) : (
              tweets.map(tweet => (
                <div key={tweet.id} onClick={() => handleOpenThread(tweet)} className="cursor-pointer">
                  <TweetCard
                    tweet={tweet}
                    isLiked={likedTweets.includes(tweet.id)}
                    isRetweeted={retweetedTweets.includes(tweet.id)}
                    onLike={() => { toggleLike(tweet.id); }}
                    onRetweet={() => { toggleRetweet(tweet.id); }}
                    onReply={() => { handleReply(tweet); }}
                    onQuote={() => { handleQuote(tweet); }}
                  />
                </div>
              ))
            )}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {hasMore && !loading && (
                <div className="w-6 h-6 border-2 border-[hsl(var(--primary))]/40 border-t-[hsl(var(--primary))] rounded-full animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Trending (desktop) */}
        <div className="hidden lg:block w-72 sticky top-20 h-fit mt-4">
          <TrendingSection />
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setReplyTo(null);
          setQuoteTweet(null);
          setComposeOpen(true);
        }}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(var(--primary))] text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] flex items-center justify-center hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] transition-shadow"
      >
        <Feather className="w-6 h-6" />
      </motion.button>

      {/* Compose Modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setReplyTo(null); setQuoteTweet(null); }}
        onSubmit={handleSubmit}
        replyTo={replyTo}
        quoteTweet={quoteTweet}
      />

      {/* Thread View */}
      <AnimatePresence>
        {threadTweet && (
          <ThreadView
            tweet={threadTweet}
            replies={threadReplies}
            isLiked={likedTweets.includes(threadTweet.id)}
            isRetweeted={retweetedTweets.includes(threadTweet.id)}
            onLike={() => toggleLike(threadTweet.id)}
            onRetweet={() => toggleRetweet(threadTweet.id)}
            onReply={() => handleReply(threadTweet)}
            onClose={() => setThreadTweet(null)}
            likedTweets={likedTweets}
            retweetedTweets={retweetedTweets}
            onLikeReply={toggleLike}
            onRetweetReply={toggleRetweet}
          />
        )}
      </AnimatePresence>

      {/* Mobile Trending */}
      <div className="lg:hidden max-w-2xl mx-auto px-4 pb-4">
        <TrendingSection />
      </div>
    </div>
  );
};

function getTimeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}د`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}س`;
  return `${Math.floor(seconds / 86400)}ي`;
}

export default Tweets;
