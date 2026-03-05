import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Clock, Search, ArrowRight, Film, TrendingUp, Star, Clapperboard, Gamepad2, GraduationCap, Award, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 12;

const categories = [
  { id: 'all', label: 'الكل', icon: Clapperboard },
  { id: 'trending', label: 'رائج', icon: TrendingUp },
  { id: 'movies', label: 'أفلام', icon: Clapperboard },
  { id: 'tech', label: 'تكنولوجيا', icon: Star },
  { id: 'gaming', label: 'ألعاب', icon: Gamepad2 },
  { id: 'education', label: 'تعليم', icon: GraduationCap },
  { id: 'entertainment', label: 'ترفيه', icon: Film },
];

const formatDuration = (seconds: number) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatViews = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

/* ───── Hero Featured Slider ───── */
const HeroSlider = ({ videos, profiles, onSelect }: { videos: any[]; profiles: Map<string, any>; onSelect: (id: string) => void }) => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (videos.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % videos.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [videos.length]);

  if (videos.length === 0) return null;
  const video = videos[current];
  const profile = profiles.get(video?.user_id);

  return (
    <div className="relative w-full aspect-[16/8] sm:aspect-[16/7] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => onSelect(video.id)}
        >
          {video.thumbnail_url ? (
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
              <Play className="w-16 h-16 text-white/10" />
            </div>
          )}

          {/* Heavy blur overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.1) 100%)' }} />
          <div className="absolute inset-0 backdrop-blur-[2px]" style={{ mask: 'linear-gradient(to top, black 0%, transparent 50%)' }} />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-10" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30"
                    style={{ boxShadow: '0 0 12px hsla(144,90%,33%,0.2)' }}>
                ★ رائج
              </span>
              {video.duration > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white/70 text-[10px] font-medium border border-white/[0.08]">
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>
            <h2 className="text-white text-lg sm:text-2xl font-bold leading-tight line-clamp-2 max-w-xl"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {video.title}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              {/* Creator avatar liquid glass circle */}
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-white/20 to-white/5 blur-[1px]" />
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover relative ring-1 ring-white/20" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/[0.08] relative ring-1 ring-white/10" />
                )}
              </div>
              <span className="text-white/70 text-xs font-medium">{profile?.full_name || profile?.username || 'مبدع'}</span>
              <span className="text-white/30 text-[10px]">•</span>
              <span className="text-white/40 text-[10px] flex items-center gap-1">
                <Eye className="w-3 h-3" /> {formatViews(video.views_count || 0)}
              </span>
            </div>
          </div>

          {/* Play CTA */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.15] flex items-center justify-center"
                 style={{ boxShadow: '0 0 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white ml-1" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); clearInterval(timerRef.current!); }}
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ───── Shimmer Skeleton ───── */
const GlassShimmer = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
        <Skeleton className="w-full aspect-video bg-white/[0.03]" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-white/[0.04]" />
          <Skeleton className="h-3 w-1/2 bg-white/[0.03]" />
        </div>
      </div>
    ))}
  </div>
);

/* ───── Video Card ───── */
const VideoCard = ({ video, profile, onClick }: { video: any; profile: any; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);
  const isEarner = (video.views_count || 0) > 500; // partner program indicator

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-pointer will-change-transform relative"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.06]"
           style={hovered ? { borderColor: 'rgba(255,255,255,0.12)', boxShadow: '0 0 20px rgba(255,255,255,0.03)' } : {}}>
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
            <Play className="w-10 h-10 text-white/8" />
          </div>
        )}

        {/* Glass shimmer overlay on hover */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
          }} />
        </div>

        {/* Floating info on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10"
            >
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-[11px] font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {profile?.full_name || profile?.username || 'مبدع'}
                </span>
              </div>
              <span className="text-white/60 text-[10px] flex items-center gap-1">
                <Eye className="w-3 h-3" /> {formatViews(video.views_count || 0)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duration pill */}
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/[0.08] text-[10px] text-white/80 font-medium z-10">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Earner golden ticket */}
        {isEarner && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(135deg, #FFD700, #B8860B)',
                   boxShadow: '0 0 8px rgba(255,215,0,0.3)',
                   border: '0.5px solid rgba(255,215,0,0.4)',
                 }}>
              <Award className="w-3.5 h-3.5 text-black/80" strokeWidth={2} />
            </div>
          </div>
        )}

        {/* Play icon center on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center"
               style={{ boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex gap-3 mt-3 px-1" dir="rtl">
        {/* Creator liquid glass circle */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-[1px] rounded-full bg-gradient-to-br from-white/15 to-white/5" />
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover relative ring-[0.5px] ring-white/10" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/[0.05] relative" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white/90 text-sm font-medium line-clamp-2 leading-snug">{video.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-white/35 text-[11px]">
            <span>{profile?.username || 'مستخدم'}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3" /> {formatViews(video.views_count || 0)}
            </span>
            {video.duration > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {formatDuration(video.duration)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ───── Main Page ───── */
const NetworkTV = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<any[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [entered, setEntered] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Deep zoom entry animation
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  const loadProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
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
  }, []);

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

      if (activeCategory !== 'all') query = query.eq('category', activeCategory);
      if (searchQuery.trim()) query = query.ilike('title', `%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      const allIds = [...new Set((data || []).map(v => v.user_id))];
      await loadProfiles(allIds);
      setVideos(prev => append ? [...prev, ...(data || [])] : (data || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, searchQuery, loadProfiles]);

  // Fetch featured (top viewed)
  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('is_published', true)
        .order('views_count', { ascending: false })
        .limit(5);
      if (data && data.length > 0) {
        setFeaturedVideos(data);
        const ids = [...new Set(data.map(v => v.user_id))];
        await loadProfiles(ids);
      }
    };
    fetchFeatured();
  }, [loadProfiles]);

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
    <motion.div
      initial={{ scale: 1.15, opacity: 0 }}
      animate={entered ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[#000000]"
    >
      {/* Cinema Curtain Reveal */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{
                     background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
                     border: '0.5px solid rgba(255,255,255,0.1)',
                   }}>
                <div className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: '0 0 12px hsla(144,90%,33%,0.6)' }} />
              </div>
              <p className="text-white/40 text-xs tracking-widest">NETWORKK CINEMA</p>
              <div className="mt-4 w-32 h-0.5 mx-auto rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-primary/40 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b border-white/[0.05]">
        <div className="flex items-center gap-3 px-4 h-13 py-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowRight className="w-5 h-5 text-white/60" strokeWidth={1.4} />
          </motion.button>
          {/* Liquid Lens Cinema Icon */}
          <div className="relative w-8 h-8 rounded-full flex items-center justify-center"
               style={{
                 background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 70%)',
                 border: '0.5px solid rgba(255,255,255,0.12)',
                 boxShadow: '0 0 12px rgba(8,160,69,0.15), inset 0 0 8px rgba(255,255,255,0.05)',
               }}>
            <div className="w-2 h-2 rounded-full bg-primary" style={{ boxShadow: '0 0 8px hsla(144,90%,33%,0.6), 0 0 2px hsla(144,90%,33%,0.9)' }} />
          </div>
          <h1 className="text-white/90 text-base font-semibold tracking-tight">
            Networ<span className="text-white/90">k</span><span className="text-primary animate-pulse">k</span> Cinema
          </h1>
          <span className="text-white/20 text-[10px] font-light ml-1">networkk.online</span>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <Search className="w-4 h-4 text-white/30" strokeWidth={1.4} />
            <input
              type="text"
              placeholder="ابحث عن فيديو..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none flex-1"
              dir="rtl"
            />
          </div>
        </div>

        {/* Categories - obsidian pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${
                activeCategory === cat.id
                  ? 'bg-white/[0.08] text-white border border-white/[0.15]'
                  : 'bg-white/[0.02] text-white/35 border border-white/[0.06]'
              }`}
              style={activeCategory === cat.id ? {
                boxShadow: '0 0 16px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
              } : {}}
            >
              <cat.icon className="w-3.5 h-3.5" strokeWidth={1.4} />
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Hero Featured Slider */}
      {featuredVideos.length > 0 && !searchQuery.trim() && activeCategory === 'all' && (
        <HeroSlider
          videos={featuredVideos}
          profiles={profiles}
          onSelect={(id) => navigate(`/watch/${id}`)}
        />
      )}

      {/* Content Grid */}
      <div className="px-4 pb-28 pt-5 max-w-5xl mx-auto">
        {loading ? (
          <GlassShimmer />
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Clapperboard className="w-14 h-14 text-white/[0.06]" strokeWidth={0.8} />
            <p className="text-white/25 text-sm">لا توجد فيديوهات حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                profile={profiles.get(video.user_id)}
                onClick={() => navigate(`/watch/${video.id}`)}
              />
            ))}
          </div>
        )}

        {/* Sentinel + loader */}
        <div ref={sentinelRef} className="h-4" />
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NetworkTV;
