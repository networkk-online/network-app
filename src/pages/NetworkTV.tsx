import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Eye, Clock, Search, ArrowRight, Film, TrendingUp, Star,
  Clapperboard, Gamepad2, GraduationCap, Award, Menu, X,
  Bell, Upload, User, BarChart3, Settings, Home, Compass, History,
  ThumbsUp, ListVideo, Flame, Music, Newspaper, Trophy, Radio,
  LogOut, Tv, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CinemaUploadModal } from '@/components/cinema/CinemaUploadModal';
import SeoHead from '@/components/seo/SeoHead';

const PAGE_SIZE = 12;

const categories = [
  { id: 'all', label: 'الكل', icon: Compass },
  { id: 'trending', label: 'رائج', icon: Flame },
  { id: 'movies', label: 'أفلام', icon: Clapperboard },
  { id: 'music', label: 'موسيقى', icon: Music },
  { id: 'gaming', label: 'ألعاب', icon: Gamepad2 },
  { id: 'news', label: 'أخبار', icon: Newspaper },
  { id: 'education', label: 'تعليم', icon: GraduationCap },
  { id: 'entertainment', label: 'ترفيه', icon: Film },
  { id: 'sports', label: 'رياضة', icon: Trophy },
  { id: 'live', label: 'بث مباشر', icon: Radio },
];

const sidebarItems = [
  { id: 'home', label: 'الرئيسية', icon: Home, path: '/network-tv' },
  { id: 'explore', label: 'استكشاف', icon: Compass, path: '/explore' },
  { id: 'trending', label: 'الرائج', icon: TrendingUp, path: '/network-tv' },
  { id: 'history', label: 'السجل', icon: History, path: '/network-tv' },
  { id: 'liked', label: 'المعجب بها', icon: ThumbsUp, path: '/saved-content' },
  { id: 'playlists', label: 'قوائم التشغيل', icon: ListVideo, path: '/saved-content' },
  { id: 'studio', label: 'الاستوديو', icon: BarChart3, path: '/creator-studio' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: '/settings' },
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

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
};

/* ───── White Neon Brand Text ───── */
const NeonBrand = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-sm';
  return (
    <h1 className={`${textSize} font-bold tracking-tight select-none whitespace-nowrap`}>
      <motion.span
        className="text-foreground"
        animate={{
          textShadow: [
            '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)',
            '0 0 12px rgba(255,255,255,0.6), 0 0 25px rgba(255,255,255,0.3)',
            '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        Networkk
      </motion.span>
      <motion.span
        className="text-foreground ml-1.5"
        animate={{
          textShadow: [
            '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)',
            '0 0 12px rgba(255,255,255,0.6), 0 0 25px rgba(255,255,255,0.3)',
            '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        Cinema
      </motion.span>
    </h1>
  );
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
    <div className="relative w-full aspect-video sm:aspect-[21/9] overflow-hidden rounded-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
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
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10" dir="rtl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">★ رائج</span>
            </div>
            <h2 className="text-foreground text-lg sm:text-2xl font-bold leading-tight line-clamp-2 max-w-xl">{video.title}</h2>
            <div className="flex items-center gap-3 mt-3">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-white/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-white/[0.08] text-foreground text-xs">{(profile?.full_name || 'م')[0]}</AvatarFallback>
              </Avatar>
              <span className="text-foreground/70 text-xs font-medium">{profile?.full_name || profile?.username || 'مبدع'}</span>
              <span className="text-foreground/30 text-[10px]">•</span>
              <span className="text-foreground/40 text-[10px] flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(video.views_count || 0)} مشاهدة</span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.15] flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(0,0,0,0.4)' }}>
              <Play className="w-6 h-6 sm:w-7 sm:h-7 text-foreground fill-white ml-1" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {videos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {videos.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); clearInterval(timerRef.current!); }}
              className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ───── Shimmer Skeleton ───── */
const GlassShimmer = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="rounded-xl overflow-hidden">
        <Skeleton className="w-full aspect-video bg-white/[0.03] rounded-xl" />
        <div className="flex gap-3 mt-3 px-1">
          <Skeleton className="w-9 h-9 rounded-full bg-white/[0.04] flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full bg-white/[0.04]" />
            <Skeleton className="h-3 w-2/3 bg-white/[0.03]" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ───── Video Card ───── */
const VideoCard = ({ video, profile, onClick }: { video: any; profile: any; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);
  const isEarner = (video.views_count || 0) > 500;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-pointer will-change-transform"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/[0.02]">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
            <Play className="w-10 h-10 text-white/[0.06]" />
          </div>
        )}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />
        {video.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[11px] text-foreground/90 font-medium z-10">{formatDuration(video.duration)}</div>
        )}
        {isEarner && (
          <div className="absolute top-2 left-2 z-10">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)', boxShadow: '0 0 6px rgba(255,215,0,0.3)' }}>
              <Award className="w-3 h-3 text-black/80" strokeWidth={2} />
            </div>
          </div>
        )}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-foreground fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-3 px-0.5" dir="rtl">
        <Avatar className="w-9 h-9 flex-shrink-0 ring-[0.5px] ring-white/10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-white/[0.06] text-foreground/60 text-xs">{(profile?.full_name || 'م')[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground/90 text-sm font-medium line-clamp-2 leading-snug">{video.title}</h3>
          <p className="text-muted-foreground text-[12px] mt-1">{profile?.username || 'مستخدم'}</p>
          <div className="flex items-center gap-1 text-muted-foreground text-[12px]">
            <span>{formatViews(video.views_count || 0)} مشاهدة</span>
            <span>•</span>
            <span>{video.created_at ? timeAgo(video.created_at) : ''}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ───── Mobile Sidebar Drawer ───── */
const MobileSidebar = ({ open, onClose, activeId, onSelect, userProfile }: {
  open: boolean; onClose: () => void; activeId: string; onSelect: (item: typeof sidebarItems[0]) => void; userProfile: any;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[70]" onClick={onClose} />
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 bottom-0 w-[260px] bg-background/95 backdrop-blur-2xl border-l border-white/[0.06] z-[80] flex flex-col"
          dir="rtl"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <NeonBrand size="sm" />
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
              <X className="w-4 h-4 text-foreground/60" />
            </motion.button>
          </div>

          {userProfile && (
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-primary/30">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-semibold truncate">{userProfile?.full_name || 'المستخدم'}</p>
                  <p className="text-muted-foreground text-[10px] truncate">@{userProfile?.username || 'user'}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 py-2 overflow-y-auto">
            {sidebarItems.map(item => (
              <motion.button key={item.id} whileTap={{ scale: 0.95 }}
                onClick={() => { onSelect(item); onClose(); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  activeId === item.id ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-foreground/60 hover:bg-white/[0.04]'
                }`}>
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/* ───── Desktop Sidebar ───── */
const DesktopSidebar = ({ collapsed, activeId, onSelect }: { collapsed: boolean; activeId: string; onSelect: (item: typeof sidebarItems[0]) => void }) => (
  <aside
    className={`hidden lg:flex flex-col fixed top-14 right-0 bottom-0 z-30 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[200px]'} bg-background/80 backdrop-blur-2xl border-l border-white/[0.06]`}
    dir="rtl"
  >
    <div className="flex-1 py-3 overflow-y-auto scrollbar-hide">
      {sidebarItems.map(item => (
        <motion.button key={item.id} whileTap={{ scale: 0.95 }} onClick={() => onSelect(item)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
            activeId === item.id ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-foreground/60 hover:bg-white/[0.04]'
          }`}>
          <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>{item.label}</span>}
        </motion.button>
      ))}
    </div>
  </aside>
);

/* ───── Profile Menu Content (shared) ───── */
const ProfileMenuContent = ({ userProfile, onClose }: { userProfile: any; onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div dir="rtl">
      {/* Neon Brand Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <NeonBrand size="sm" />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/30 flex-shrink-0">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-foreground font-semibold text-sm">{userProfile?.full_name || 'المستخدم'}</p>
            <p className="text-muted-foreground text-[11px] truncate">@{userProfile?.username || 'user'}</p>
            {userProfile?.is_verified && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary font-medium"><Star className="w-3 h-3 fill-primary" /> موثق</span>
            )}
          </div>
        </div>
      </div>

      {/* Studio Switcher */}
      <div className="p-3">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { onClose(); navigate('/creator-studio'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all group"
          style={{ boxShadow: '0 0 20px hsla(144,90%,33%,0.08)' }}>
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
            <Tv className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-right flex-1 min-w-0">
            <p className="text-primary text-sm font-semibold">التبديل إلى Cinema Studio</p>
            <p className="text-primary/60 text-[10px]">إدارة قناتك ومحتواك</p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary/40 rotate-180 flex-shrink-0" />
        </motion.button>
      </div>

      {/* Links */}
      <div className="px-2 pb-3 space-y-0.5">
        {[
          { label: 'ملفك الشخصي', icon: User, path: '/profile' },
          { label: 'استوديو المبدعين', icon: BarChart3, path: '/creator-studio' },
          { label: 'الإعدادات', icon: Settings, path: '/settings' },
        ].map(item => (
          <motion.button key={item.path} whileTap={{ scale: 0.97 }}
            onClick={() => { onClose(); navigate(item.path); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/70 hover:bg-white/[0.04] transition-colors">
            <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} /><span>{item.label}</span>
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => { onClose(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive/70 hover:bg-destructive/10 transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} /><span>العودة للشبكة</span>
        </motion.button>
      </div>
    </div>
  );
};

/* ───── Profile Menu (responsive: dropdown on desktop, bottom sheet on mobile) ───── */
const ProfileDropdown = ({ userProfile, onClose }: { userProfile: any; onClose: () => void }) => {
  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/50" onClick={onClose} />

      {/* Desktop: dropdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="hidden sm:block fixed top-14 left-4 z-[100] min-w-[300px] max-w-[340px] bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1) inset' }}
      >
        <ProfileMenuContent userProfile={userProfile} onClose={onClose} />
      </motion.div>

      {/* Mobile: bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="sm:hidden fixed inset-x-0 bottom-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-white/[0.08] rounded-t-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <ProfileMenuContent userProfile={userProfile} onClose={onClose} />
        {/* Safe area padding */}
        <div className="h-6" />
      </motion.div>
    </>
  );
};

/* ═══════════════════════════════════════════════ */
/* ═══ Main Page ═══ */
/* ═══════════════════════════════════════════════ */
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeSidebarId, setActiveSidebarId] = useState('home');
  const [uploadOpen, setUploadOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) setUserProfile(profile);
      }
    };
    loadUser();
  }, []);

  const loadProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data: profs } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified').in('id', userIds);
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
      let query = supabase.from('videos').select('*').eq('is_published', true).order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
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

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase.from('videos').select('*').eq('is_published', true).order('views_count', { ascending: false }).limit(5);
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

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        fetchVideos(videos.length, true);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [videos.length, hasMore, loadingMore, loading, fetchVideos]);

  const handleSidebarSelect = (item: typeof sidebarItems[0]) => {
    setActiveSidebarId(item.id);
    if (item.id === 'trending') {
      setActiveCategory('trending');
    } else {
      navigate(item.path);
    }
  };

  /* Compute main content margin for desktop sidebar */
  const mainMargin = sidebarCollapsed ? 'lg:mr-[72px]' : 'lg:mr-[200px]';

  return (
    <motion.div
      initial={{ scale: 1.05, opacity: 0 }}
      animate={entered ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-background"
    >
      <SeoHead route="/network-tv" />
      {/* Cinema Curtain */}
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top' }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
              <NeonBrand size="lg" />
              <div className="mt-4 w-28 h-0.5 mx-auto rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full bg-primary/40 rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.4 }} />
              </div>
              <p className="text-muted-foreground text-[10px] mt-2">Syncing your Network Identity...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeId={activeSidebarId}
        onSelect={handleSidebarSelect}
        userProfile={userProfile}
      />

      {/* ═══ Top Header ═══ */}
      <header className="sticky top-0 z-50 h-14 bg-background/80 backdrop-blur-2xl border-b border-white/[0.05] flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0" dir="rtl">
          {/* Desktop: sidebar toggle */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarCollapsed(p => !p)}
            className="hidden lg:flex w-9 h-9 rounded-full items-center justify-center hover:bg-white/[0.06] transition-colors flex-shrink-0">
            <Menu className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
          </motion.button>
          {/* Mobile: hamburger */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Menu className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
          </motion.button>

          {/* White Neon Brand */}
          <div className="cursor-pointer min-w-0 flex-shrink-0" onClick={() => navigate('/network-tv')}>
            <NeonBrand />
          </div>
        </div>

        {/* Search - hidden on mobile, shown inline */}
        <div className="hidden sm:flex items-center max-w-md w-full flex-shrink">
          <div className="flex items-center w-full bg-white/[0.04] border border-white/[0.08] rounded-full overflow-hidden">
            <input type="text" placeholder="ابحث في Networkk Cinema..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 px-4 py-2" dir="rtl" />
            <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-2 bg-white/[0.06] border-r border-white/[0.08] hover:bg-white/[0.1] transition-colors">
              <Search className="w-4 h-4 text-foreground/50" strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 relative flex-shrink-0">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setUploadOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-[#39FF14]/10 flex items-center justify-center transition-colors group"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(57,255,20,0.15)' }}>
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#39FF14] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors relative">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/60" strokeWidth={1.5} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowProfileMenu(p => !p)} className="flex items-center gap-1">
            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-white/10 hover:ring-primary/40 transition-all">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{(userProfile?.full_name || userProfile?.username || 'U')[0]}</AvatarFallback>
            </Avatar>
            <ChevronDown className={`w-3 h-3 text-foreground/40 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
          </motion.button>
          <AnimatePresence>
            {showProfileMenu && <ProfileDropdown userProfile={userProfile} onClose={() => setShowProfileMenu(false)} />}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile search */}
      <div className="sm:hidden px-3 py-2 bg-background/80 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.4} />
          <input type="text" placeholder="ابحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-0" dir="rtl" />
        </div>
      </div>

      {/* Category chips */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-2xl border-b border-white/[0.05] px-3 sm:px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" dir="rtl">
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id ? 'bg-foreground text-background' : 'bg-white/[0.06] text-foreground/70 hover:bg-white/[0.1]'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <DesktopSidebar collapsed={sidebarCollapsed} activeId={activeSidebarId} onSelect={handleSidebarSelect} />

      {/* Main Content */}
      <main className={`transition-all duration-300 ${mainMargin}`}>
        <div className="px-3 sm:px-4 pb-28 pt-4 max-w-[1400px] mx-auto space-y-6">
          {featuredVideos.length > 0 && !searchQuery.trim() && activeCategory === 'all' && (
            <HeroSlider videos={featuredVideos} profiles={profiles} onSelect={(id) => navigate(`/watch/${id}`)} />
          )}
          {loading ? (
            <GlassShimmer />
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Clapperboard className="w-14 h-14 text-white/[0.06]" strokeWidth={0.8} />
              <p className="text-muted-foreground text-sm">لا توجد فيديوهات حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map(video => (
                <VideoCard key={video.id} video={video} profile={profiles.get(video.user_id)} onClick={() => navigate(`/watch/${video.id}`)} />
              ))}
            </div>
          )}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/10 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </main>

      <CinemaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => fetchVideos(0, false)}
      />
    </motion.div>
  );
};

export default NetworkTV;
