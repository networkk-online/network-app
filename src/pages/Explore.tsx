import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, User, TrendingUp, Camera, Cpu, Palette, Hash, Film, Flame, Play, Grid3X3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface ExplorePost {
  id: string;
  content: string;
  media_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

const categories = [
  { id: 'trending', label: 'الأكثر رواجاً', icon: TrendingUp },
  { id: 'photography', label: 'تصوير', icon: Camera },
  { id: 'tech', label: 'تكنولوجيا', icon: Cpu },
  { id: 'art', label: 'فن', icon: Palette },
  { id: 'reels', label: 'ريلز', icon: Film },
  { id: 'hashtags', label: 'هاشتاقات', icon: Hash },
  { id: 'popular', label: 'شعبي', icon: Flame },
];

const PAGE_SIZE = 21; // divisible by 3

// Instagram-style pattern: every 3rd row has a tall item
const isTallItem = (index: number) => {
  const group = Math.floor(index / 9);
  const posInGroup = index % 9;
  // In each group of 9, position 2 is tall (spans 2 rows on right)
  // and position 6 is tall (spans 2 rows on left)
  return posInGroup === 2 || posInGroup === 6;
};

const Explore = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      let query = supabase
        .from('posts')
        .select('id, content, media_url, likes_count, comments_count, created_at, user_id')
        .order(activeCategory === 'trending' ? 'likes_count' : 'created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (activeCategory === 'photography') query = query.or('content.ilike.%تصوير%,content.ilike.%photo%,content.ilike.%كاميرا%');
      else if (activeCategory === 'tech') query = query.or('content.ilike.%تكنولوجيا%,content.ilike.%tech%,content.ilike.%برمجة%');
      else if (activeCategory === 'art') query = query.or('content.ilike.%فن%,content.ilike.%رسم%,content.ilike.%art%');

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_verified')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const enriched = (data || []).map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || { username: 'user', avatar_url: null, is_verified: false },
      }));

      setPosts(prev => append ? [...prev, ...enriched] : enriched);
    } catch (e) {
      console.error('Explore fetch error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, false);
  }, [activeCategory, fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchPosts(posts.length, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [posts.length, hasMore, loadingMore, loading, fetchPosts]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('explore-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts(0, false);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified, followers_count')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .order('followers_count', { ascending: false })
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePostClick = (postId: string, index: number) => {
    // Save scroll position
    if (scrollContainerRef.current) {
      sessionStorage.setItem('explore-scroll', window.scrollY.toString());
    }
    navigate(`/explore/feed/${postId}?idx=${index}`);
  };

  // Restore scroll on back
  useEffect(() => {
    const saved = sessionStorage.getItem('explore-scroll');
    if (saved && posts.length > 0) {
      setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
      sessionStorage.removeItem('explore-scroll');
    }
  }, [posts.length]);

  return (
    <div className="min-h-screen bg-black" ref={scrollContainerRef}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b-[0.5px] border-white/[0.08]">
        <div className="px-4 pt-3 pb-2">
          {/* Brand */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-lg font-bold tracking-tight">استكشاف</h1>
            <span className="text-white/30 text-[10px] tracking-widest">networkk.online</span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.4} />
            <input
              type="text"
              placeholder="بحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-white/[0.06] backdrop-blur-[25px] border-[0.5px] border-white/[0.15] rounded-xl pr-10 pl-4 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {categories.map(cat => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 h-8 rounded-lg whitespace-nowrap text-[11px] font-medium border-[0.5px] transition-all shrink-0 ${
                    active
                      ? 'bg-white/[0.12] border-primary/30 text-primary shadow-[0_0_12px_hsla(144,90%,33%,0.15)]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/40 active:scale-95'
                  }`}
                >
                  <Icon className="w-3 h-3" strokeWidth={1.6} />
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 py-2 space-y-1"
          >
            {searching ? (
              <div className="py-6 text-center text-white/30 text-sm">جاري البحث...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-6 text-center text-white/30 text-sm">لا توجد نتائج</div>
            ) : (
              searchResults.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => navigate(`/profile/${user.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border-[0.5px] border-white/[0.08] cursor-pointer active:scale-[0.97] transition-transform"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-white/5"><User className="w-4 h-4 text-white/40" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-white text-sm font-medium truncate">{user.full_name || user.username}</span>
                      {user.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <span className="text-white/40 text-xs">@{user.username}</span>
                  </div>
                  <span className="text-white/30 text-xs">{user.followers_count || 0} متابع</span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instagram 3-Column Grid */}
      <main className="pb-24">
        {loading ? (
          <div className="grid grid-cols-3 gap-[2px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`bg-white/[0.04] ${isTallItem(i) ? 'row-span-2 aspect-[1/2]' : 'aspect-square'}`}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Grid3X3 className="w-12 h-12 text-white/10 mb-3" />
            <p className="text-white/30 text-sm">لا توجد منشورات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[2px]">
            {posts.map((post, i) => {
              const tall = isTallItem(i);
              const isVideo = post.media_url?.includes('.mp4') || post.media_url?.includes('.webm') || post.media_url?.includes('.mov');
              const hasImage = !!post.media_url;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  onClick={() => handlePostClick(post.id, i)}
                  className={`relative overflow-hidden cursor-pointer group active:opacity-80 transition-opacity ${
                    tall ? 'row-span-2' : ''
                  }`}
                >
                  {hasImage ? (
                    <img
                      src={post.media_url!}
                      alt=""
                      className={`w-full object-cover ${tall ? 'h-full aspect-[1/2]' : 'aspect-square'}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full bg-white/[0.03] flex items-center justify-center p-3 ${tall ? 'aspect-[1/2]' : 'aspect-square'}`}>
                      <p className="text-white/50 text-[11px] text-center line-clamp-4 leading-relaxed">{post.content}</p>
                    </div>
                  )}

                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />

                  {/* Video play icon */}
                  {isVideo && (
                    <div className="absolute top-2 right-2 z-10">
                      <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" strokeWidth={0} />
                    </div>
                  )}

                  {/* Multi-image indicator */}
                  {!isVideo && hasImage && (
                    <div className="absolute inset-0 pointer-events-none" 
                         style={{ boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }} />
                  )}

                  {/* Hover stats */}
                  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity z-10">
                    <span className="flex items-center gap-1 text-white text-sm font-semibold drop-shadow-lg">
                      ❤️ {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-white text-sm font-semibold drop-shadow-lg">
                      💬 {post.comments_count || 0}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;
