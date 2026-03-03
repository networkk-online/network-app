import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Clock, Search, ArrowRight, Film, TrendingUp, Star, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 12;

const categories = [
  { id: 'all', label: 'الكل', icon: Tv },
  { id: 'trending', label: 'رائج', icon: TrendingUp },
  { id: 'entertainment', label: 'ترفيه', icon: Star },
  { id: 'education', label: 'تعليم', icon: Film },
  { id: 'tech', label: 'تكنولوجيا', icon: Film },
  { id: 'gaming', label: 'ألعاب', icon: Film },
];

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatViews = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const GlassShimmer = () => (
  <div className="space-y-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="glass-card p-0 overflow-hidden">
        <Skeleton className="w-full aspect-video bg-white/[0.03]" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-white/[0.04]" />
          <Skeleton className="h-3 w-1/2 bg-white/[0.03]" />
        </div>
      </div>
    ))}
  </div>
);

const NetworkTV = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchVideos = useCallback(async (offset: number, append: boolean) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      const userIds = [...new Set((data || []).map(v => v.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .in('id', userIds);
        if (profs) {
          setProfiles(prev => {
            const next = new Map(prev);
            profs.forEach(p => next.set(p.id, p));
            return next;
          });
        }
      }

      setVideos(prev => append ? [...prev, ...(data || [])] : (data || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setVideos([]);
    setHasMore(true);
    fetchVideos(0, false);
  }, [fetchVideos]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchVideos(videos.length, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [videos.length, hasMore, loadingMore, loading, fetchVideos]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center gap-3 px-4 h-13 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="glass-btn w-9 h-9 flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white/70" strokeWidth={1.4} />
          </motion.button>
          <Tv className="w-5 h-5 text-primary" strokeWidth={1.4} />
          <h1 className="text-foreground text-base font-semibold">Network TV</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="glass-input flex items-center gap-2 px-4 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.4} />
            <input
              type="text"
              placeholder="ابحث عن فيديو..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              dir="rtl"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${
                activeCategory === cat.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white/[0.04] text-white/50 border border-white/[0.08]'
              }`}
              style={activeCategory === cat.id ? { boxShadow: '0 0 12px hsla(144, 90%, 33%, 0.2)' } : {}}
            >
              <cat.icon className="w-3.5 h-3.5" strokeWidth={1.4} />
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-28 pt-4 max-w-4xl mx-auto">
        {loading ? (
          <GlassShimmer />
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Tv className="w-12 h-12 text-white/10" strokeWidth={1} />
            <p className="text-muted-foreground text-sm">لا توجد فيديوهات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {videos.map((video, i) => {
                const profile = profiles.get(video.user_id);
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={() => navigate(`/watch/${video.id}`)}
                    className="glass-card cursor-pointer group will-change-transform"
                    style={{ transform: 'translateZ(0)' }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-t-[1.75rem]">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                          <Play className="w-10 h-10 text-white/10" />
                        </div>
                      )}
                      {/* Glass overlay on edges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Duration pill */}
                      {video.duration > 0 && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/[0.1] text-[10px] text-white/90 font-medium">
                          {formatDuration(video.duration)}
                        </div>
                      )}

                      {/* Play hover indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex gap-3 relative z-10">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/[0.06] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0" dir="rtl">
                        <h3 className="text-foreground text-sm font-medium line-clamp-2 leading-snug">{video.title}</h3>
                        <p className="text-muted-foreground text-xs mt-1">
                          {profile?.username || 'مستخدم'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" strokeWidth={1.4} />
                            {formatViews(video.views_count || 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.4} />
                            {formatDuration(video.duration || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

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

export default NetworkTV;
