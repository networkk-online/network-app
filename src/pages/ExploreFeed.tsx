import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Post from '@/components/Post';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const PAGE_SIZE = 10;

const ExploreFeed = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [mainPost, setMainPost] = useState<any>(null);
  const [suggestedPosts, setSuggestedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const getTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
    return `${Math.floor(diff / 604800)} أ`;
  };

  const fetchPostWithProfile = async (id: string) => {
    const { data: post } = await supabase.from('posts').select('*').eq('id', id).single();
    if (!post) return null;
    const { data: profile } = await supabase.from('profiles').select('username, full_name, avatar_url, is_verified').eq('id', post.user_id).single();
    return { ...post, profile };
  };

  const fetchSuggested = useCallback(async (offset: number, append: boolean) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, media_url, likes_count, comments_count, created_at, user_id')
        .neq('id', postId!)
        .order('likes_count', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const enriched = (data || []).map(p => ({
        ...p,
        profile: profileMap.get(p.user_id) || { username: 'user', avatar_url: null, is_verified: false },
      }));

      setSuggestedPosts(prev => append ? [...prev, ...enriched] : enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const post = await fetchPostWithProfile(postId!);
      setMainPost(post);
      await fetchSuggested(0, false);
    };
    load();
  }, [postId, fetchSuggested]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchSuggested(suggestedPosts.length, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [suggestedPosts.length, hasMore, loadingMore, loading, fetchSuggested]);

  const renderPost = (post: any) => (
    <Post
      key={post.id}
      id={post.id}
      userId={post.user_id}
      username={post.profile?.username || 'مستخدم'}
      userAvatar={post.profile?.avatar_url || '/default-avatar.jpg'}
      isVerified={post.profile?.is_verified || false}
      image={post.media_url || undefined}
      caption={post.content}
      likes={post.likes_count || 0}
      commentsCount={post.comments_count || 0}
      timeAgo={getTimeAgo(post.created_at)}
      walletEarnings={0}
      musicTitle={post.music_title}
      musicArtist={post.music_artist}
      musicUrl={post.music_url}
      musicStartTime={(post as any).music_start_time ?? 0}
    />
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky back header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b-[0.5px] border-white/[0.08]">
        <div className="flex items-center gap-3 px-4 h-12">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/explore')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] border-[0.5px] border-white/[0.1] active:scale-95 transition-transform"
          >
            <ArrowRight className="w-5 h-5 text-white/70" strokeWidth={1.4} />
          </motion.button>
          <h1 className="text-white text-base font-semibold">استكشاف</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-24">
        {/* Main post with zoom-in animation */}
        {loading && !mainPost ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-40 bg-white/[0.04]" />
            <Skeleton className="w-full aspect-square bg-white/[0.04]" />
          </div>
        ) : mainPost ? (
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {renderPost(mainPost)}
          </motion.div>
        ) : (
          <div className="py-20 text-center text-white/30">المنشور غير موجود</div>
        )}

        {/* Divider */}
        {mainPost && suggestedPosts.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-[0.5px] flex-1 bg-white/[0.08]" />
              <span className="text-white/30 text-[11px] font-medium">منشورات مقترحة</span>
              <div className="h-[0.5px] flex-1 bg-white/[0.08]" />
            </div>
          </div>
        )}

        {/* Suggested posts feed */}
        {suggestedPosts.map(post => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderPost(post)}
          </motion.div>
        ))}

        {/* Sentinel + loader */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreFeed;
