import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, User, TrendingUp, Camera, Cpu, Palette, Hash, Film, Heart, MessageCircle, Eye, Flame } from 'lucide-react';
import Header from '@/components/Header';
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

const PAGE_SIZE = 20;

const GlassShimmer = ({ tall = false }: { tall?: boolean }) => (
  <div className={`rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] ${tall ? 'row-span-2' : ''}`}>
    <Skeleton className="w-full h-full min-h-[160px] bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent animate-pulse" />
  </div>
);

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

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      let query = supabase
        .from('posts')
        .select('id, content, media_url, likes_count, comments_count, created_at, user_id')
        .order(activeCategory === 'trending' ? 'likes_count' : 'created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      // Filter by category keywords
      if (activeCategory === 'photography') query = query.or('content.ilike.%تصوير%,content.ilike.%photo%,content.ilike.%كاميرا%');
      else if (activeCategory === 'tech') query = query.or('content.ilike.%تكنولوجيا%,content.ilike.%tech%,content.ilike.%برمجة%');
      else if (activeCategory === 'art') query = query.or('content.ilike.%فن%,content.ilike.%رسم%,content.ilike.%art%');

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      // Fetch profiles
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

  // Real-time updates
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

  // Masonry layout: assign columns
  const getColumns = () => {
    const cols: ExplorePost[][] = [[], []];
    posts.forEach((post, i) => cols[i % 2].push(post));
    return cols;
  };

  const columns = getColumns();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-14 pb-24 px-4">
        {/* Search Bar — full width glass pill */}
        <div className="relative mt-2 mb-3">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.4} />
          <input
            type="text"
            placeholder="بحث في networkk.online..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-white/[0.05] backdrop-blur-[25px] border-[0.5px] border-white/20 rounded-full pr-11 pl-4 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 focus:shadow-[0_0_0_2px_hsla(144,90%,33%,0.1)] transition-all"
          />
        </div>

        {/* Search Results Overlay */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 space-y-1"
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
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] backdrop-blur-[25px] border-[0.5px] border-white/10 cursor-pointer active:scale-[0.97] transition-transform"
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

        {/* Category Ribbon — horizontal glass pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
          {categories.map(cat => {
            const active = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 h-9 rounded-full whitespace-nowrap text-xs font-medium border-[0.5px] transition-all shrink-0 ${
                  active
                    ? 'bg-white/[0.1] border-primary/30 text-primary shadow-[0_0_12px_hsla(144,90%,33%,0.2)]'
                    : 'bg-white/[0.04] border-white/10 text-white/50 active:scale-95'
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.6} />
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Masonry Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <GlassShimmer key={i} tall={i % 3 === 0} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <SearchIcon className="w-12 h-12 text-white/10 mb-3" />
            <p className="text-white/30 text-sm">لا توجد منشورات بعد</p>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-2">
                {col.map((post, postIdx) => {
                  const isImagePost = !!post.media_url;
                  const isTall = postIdx % 3 === 0;
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: postIdx * 0.04 }}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="relative rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-[25px] border-[0.5px] border-white/[0.08] cursor-pointer group active:scale-[0.97] transition-transform"
                      style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Specular shine */}
                      <div className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                           style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)' }} />

                      {isImagePost ? (
                        <img
                          src={post.media_url!}
                          alt=""
                          className={`w-full object-cover ${isTall ? 'h-72' : 'h-48'}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className={`p-4 flex items-center justify-center ${isTall ? 'min-h-[240px]' : 'min-h-[160px]'}`}>
                          <p className="text-white/70 text-sm text-center line-clamp-5 leading-relaxed">{post.content}</p>
                        </div>
                      )}

                      {/* Glass overlay gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* User + Stats */}
                      <div className="absolute bottom-0 inset-x-0 p-3 z-20">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-5 h-5 ring-1 ring-white/20">
                            <AvatarImage src={post.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/5 text-[8px]">
                              <User className="w-3 h-3 text-white/40" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white/70 text-[11px] truncate">@{post.profile?.username}</span>
                          {post.profile?.is_verified && <VerifiedBadge size="sm" />}
                        </div>
                        <div className="flex items-center gap-3 text-white/50 text-[10px]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" strokeWidth={1.4} />
                            {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" strokeWidth={1.4} />
                            {post.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
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
