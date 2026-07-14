import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Home, Flame, Music2, Gamepad2, Newspaper, Film, GraduationCap, Radio, Tv,
  History as HistoryIcon, ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal,
  Clock, ListVideo, Video as VideoIcon, PlaySquare, Users, Search, Upload,
  Bell, Menu, ChevronDown, ChevronUp, MessageCircle, Send, Sparkles, Trophy,
  Maximize2, Minimize2, ArrowRight, Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { CinemaUploadModal } from '@/components/cinema/CinemaUploadModal';
import HlsPlayer from '@/components/HlsPlayer';

const NEON = '#39FF14';

interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  user_id: string;
  uploader?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

interface Match {
  id: string; home_team: string; away_team: string; league: string | null;
  start_time: string; status: string; stream_url: string | null; thumbnail_url: string | null;
}

interface CommentRow {
  id: string; content: string; created_at: string; user_id: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null };
  likes?: number; disliked?: boolean; liked?: boolean;
  replies?: CommentRow[];
}

type SidebarKey = 'home' | 'shorts' | 'subs' | 'library' | 'history' | 'mine' | 'watchlater' | 'liked' | 'live';

const CATEGORY_PILLS = [
  { id: 'all', label: 'الكل' },
  { id: 'trending', label: 'رائج' },
  { id: 'gaming', label: 'ألعاب' },
  { id: 'music', label: 'موسيقى' },
  { id: 'sports', label: 'رياضة' },
  { id: 'news', label: 'أخبار' },
  { id: 'movies', label: 'أفلام' },
  { id: 'education', label: 'تعليم' },
  { id: 'entertainment', label: 'ترفيه' },
  { id: 'live', label: 'مباشر' },
];

const SIDEBAR_MAIN: { key: SidebarKey; label: string; icon: any }[] = [
  { key: 'home', label: 'الرئيسية', icon: Home },
  { key: 'shorts', label: 'شورتس', icon: PlaySquare },
  { key: 'subs', label: 'الاشتراكات', icon: Users },
  { key: 'live', label: 'البث المباشر', icon: Radio },
];
const SIDEBAR_YOU: { key: SidebarKey; label: string; icon: any }[] = [
  { key: 'library', label: 'المكتبة', icon: ListVideo },
  { key: 'history', label: 'السجل', icon: HistoryIcon },
  { key: 'mine', label: 'فيديوهاتي', icon: VideoIcon },
  { key: 'watchlater', label: 'المشاهدة لاحقاً', icon: Clock },
  { key: 'liked', label: 'الفيديوهات المفضّلة', icon: ThumbsUp },
];

const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const timeAgo = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'الآن';
  if (d < 3600) return `${Math.floor(d / 60)} د`;
  if (d < 86400) return `${Math.floor(d / 3600)} س`;
  if (d < 604800) return `${Math.floor(d / 86400)} يوم`;
  if (d < 2592000) return `${Math.floor(d / 604800)} أسبوع`;
  if (d < 31536000) return `${Math.floor(d / 2592000)} شهر`;
  return `${Math.floor(d / 31536000)} سنة`;
};

const getYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
};
const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

const LS_HISTORY = 'ntv:history';
const LS_WATCHLATER = 'ntv:watchlater';

const readLS = (k: string): string[] => {
  try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; }
};
const writeLS = (k: string, ids: string[]) => localStorage.setItem(k, JSON.stringify(ids.slice(0, 200)));

const SmartPlayer = ({ video, cinema }: { video: Video; cinema: boolean }) => {
  const yt = getYouTubeId(video.video_url);
  const cls = `w-full ${cinema ? 'aspect-video max-h-[85vh]' : 'aspect-video'} bg-black rounded-2xl overflow-hidden ring-1 ring-white/[0.06]`;
  if (yt) return (
    <div className={cls}>
      <iframe key={yt} src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`}
        title={video.title} className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
    </div>
  );
  if (isHls(video.video_url)) return (
    <div className={cls}>
      <HlsPlayer src={video.video_url} poster={video.thumbnail_url || undefined} className="w-full h-full object-contain bg-black" />
    </div>
  );
  return (
    <div className={cls}>
      <video key={video.id} src={video.video_url} poster={video.thumbnail_url || undefined}
        controls autoPlay playsInline className="w-full h-full object-contain bg-black" />
    </div>
  );
};

const VideoCard = ({ v, onSelect, layout = 'grid' }: { v: Video; onSelect: (v: Video) => void; layout?: 'grid' | 'row' }) => {
  if (layout === 'row') {
    return (
      <button onClick={() => onSelect(v)}
        className="w-full text-right flex gap-3 p-2 rounded-xl hover:bg-white/[0.05] transition group">
        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-black/60 shrink-0">
          {v.thumbnail_url ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-white/20" /></div>}
          {v.duration ? (
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-black/85 font-mono">
              {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold leading-snug line-clamp-2">{v.title}</div>
          <div className="text-[11px] text-white/50 mt-1 truncate">{v.uploader?.full_name || v.uploader?.username || 'مستخدم'}</div>
          <div className="text-[11px] text-white/40 mt-0.5">
            {formatCount(v.views_count || 0)} مشاهدة • {timeAgo(v.created_at)}
          </div>
        </div>
      </button>
    );
  }
  return (
    <button onClick={() => onSelect(v)} className="group text-right rounded-xl overflow-hidden transition">
      <div className="relative aspect-video bg-black/60 rounded-xl overflow-hidden">
        {v.thumbnail_url
          ? <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
          : <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-white/15" /></div>}
        {v.duration ? (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[11px] rounded bg-black/85 font-mono">
            {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      <div className="pt-3 flex gap-3">
        <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
          {v.uploader?.avatar_url
            ? <img src={v.uploader.avatar_url} alt="" className="w-full h-full object-cover" />
            : (v.uploader?.username?.[0] || 'U').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold line-clamp-2 leading-snug">{v.title}</div>
          <div className="text-[12px] text-white/50 mt-1 truncate hover:text-white transition">
            {v.uploader?.full_name || v.uploader?.username || 'مستخدم'}
          </div>
          <div className="text-[12px] text-white/40">
            {formatCount(v.views_count || 0)} مشاهدة • {timeAgo(v.created_at)}
          </div>
        </div>
      </div>
    </button>
  );
};

const NetworkTV = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sidebarKey, setSidebarKey] = useState<SidebarKey>('home');
  const [activePill, setActivePill] = useState('all');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'home' | 'watch'>('home');
  const [selected, setSelected] = useState<Video | null>(null);
  const [cinema, setCinema] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<{ avatar_url: string | null; username: string | null } | null>(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [history, setHistory] = useState<string[]>(() => readLS(LS_HISTORY));
  const [watchLater, setWatchLater] = useState<string[]>(() => readLS(LS_WATCHLATER));
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [subIds, setSubIds] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth + profile
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: p } = await supabase.from('profiles').select('avatar_url, username').eq('id', uid).maybeSingle();
        setMe(p as any);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load videos + matches
  const loadVideos = useCallback(async () => {
    const { data } = await supabase.from('videos')
      .select('id,title,description,category,video_url,thumbnail_url,duration,views_count,likes_count,comments_count,created_at,user_id')
      .eq('is_published', true).order('created_at', { ascending: false }).limit(120);
    const rows = (data as Video[]) || [];
    const ids = Array.from(new Set(rows.map(v => v.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles')
        .select('id, username, full_name, avatar_url').in('id', ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      rows.forEach(v => { v.uploader = map.get(v.user_id) as any; });
    }
    setVideos(rows);
  }, []);
  const loadMatches = useCallback(async () => {
    const { data } = await supabase.from('matches')
      .select('id, home_team, away_team, league, start_time, status, stream_url, thumbnail_url')
      .order('start_time', { ascending: false });
    setMatches((data as Match[]) || []);
  }, []);

  useEffect(() => {
    loadVideos(); loadMatches();
    const ch = supabase.channel('ntv-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, loadVideos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadMatches)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadVideos, loadMatches]);

  // Load my liked + subscriptions
  useEffect(() => {
    if (!userId) { setLikedIds([]); setSubIds([]); return; }
    (async () => {
      const [{ data: lk }, { data: sb }] = await Promise.all([
        supabase.from('video_likes').select('video_id').eq('user_id', userId),
        supabase.from('follows').select('following_id').eq('follower_id', userId),
      ]);
      setLikedIds((lk || []).map((r: any) => r.video_id));
      setSubIds((sb || []).map((r: any) => r.following_id));
    })();
  }, [userId]);

  // Watch page side effects
  useEffect(() => {
    if (!selected || mode !== 'watch') return;
    setLikeCount(selected.likes_count || 0);
    setLiked(likedIds.includes(selected.id));
    setDisliked(false);
    setDescExpanded(false);
    setSubscribed(subIds.includes(selected.user_id));

    (async () => {
      const { data: cs } = await supabase.from('video_comments')
        .select('id, content, created_at, user_id').eq('video_id', selected.id)
        .order('created_at', { ascending: false }).limit(80);
      const rows = ((cs as CommentRow[]) || []).map(r => ({ ...r, likes: 0, replies: [] }));
      const ids = Array.from(new Set(rows.map(r => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles')
          .select('id, username, full_name, avatar_url').in('id', ids);
        const map = new Map((profs || []).map((p: any) => [p.id, p]));
        rows.forEach(r => { r.author = map.get(r.user_id) as any; });
      }
      setComments(rows);

      const { count } = await supabase.from('follows')
        .select('*', { count: 'exact', head: true }).eq('following_id', selected.user_id);
      setSubCount(count || 0);
    })();

    // Push to history
    setHistory(prev => {
      const next = [selected.id, ...prev.filter(id => id !== selected.id)];
      writeLS(LS_HISTORY, next); return next;
    });

    // View bump after 5s
    const t = setTimeout(async () => {
      await supabase.from('videos').update({ views_count: (selected.views_count || 0) + 1 }).eq('id', selected.id);
    }, 5000);
    return () => clearTimeout(t);
  }, [selected?.id, mode]); // eslint-disable-line

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (sidebarKey === 'shorts') list = list.filter(v => (v.duration || 0) > 0 && (v.duration || 0) <= 60);
    else if (sidebarKey === 'subs') list = list.filter(v => subIds.includes(v.user_id));
    else if (sidebarKey === 'mine' && userId) list = list.filter(v => v.user_id === userId);
    else if (sidebarKey === 'liked') list = list.filter(v => likedIds.includes(v.id));
    else if (sidebarKey === 'watchlater') list = watchLater.map(id => videos.find(v => v.id === id)).filter(Boolean) as Video[];
    else if (sidebarKey === 'history') list = history.map(id => videos.find(v => v.id === id)).filter(Boolean) as Video[];
    else if (sidebarKey === 'library') list = [...list].slice(0, 24);

    if (activePill === 'trending') list = [...list].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    else if (activePill !== 'all' && activePill !== 'live') list = list.filter(v => v.category === activePill);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(v => v.title.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [videos, sidebarKey, activePill, query, subIds, likedIds, watchLater, history, userId]);

  const upNext = useMemo(() => {
    if (!selected) return [];
    return videos.filter(v => v.id !== selected.id).slice(0, 15);
  }, [videos, selected]);

  const openWatch = (v: Video) => {
    setSelected(v); setMode('watch');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const backHome = () => { setMode('home'); setCinema(false); };

  const handleLike = async () => {
    if (!userId || !selected) { toast.error('سجّل الدخول أولاً'); return; }
    if (liked) {
      setLiked(false); setLikeCount(c => Math.max(0, c - 1));
      setLikedIds(ids => ids.filter(i => i !== selected.id));
      await supabase.from('video_likes').delete().eq('video_id', selected.id).eq('user_id', userId);
    } else {
      setLiked(true); setDisliked(false); setLikeCount(c => c + 1);
      setLikedIds(ids => [selected.id, ...ids]);
      await supabase.from('video_likes').insert({ video_id: selected.id, user_id: userId });
    }
  };
  const handleDislike = () => {
    if (!userId) { toast.error('سجّل الدخول أولاً'); return; }
    if (disliked) setDisliked(false);
    else { setDisliked(true); if (liked) handleLike(); }
  };
  const handleShare = async () => {
    if (!selected) return;
    const url = `${window.location.origin}/network-tv?v=${selected.id}`;
    try {
      if (navigator.share) await navigator.share({ title: selected.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('تم نسخ الرابط'); }
    } catch {/**/}
  };
  const handleDownload = async () => {
    if (!selected) return;
    if (getYouTubeId(selected.video_url)) { toast.error('لا يمكن تحميل مقاطع يوتيوب'); return; }
    try {
      const response = await fetch(selected.video_url, { mode: 'cors' });
      if (!response.ok) throw new Error('download_failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = `${selected.title || 'network-video'}.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('بدأ تحميل الفيديو');
    } catch {
      const a = document.createElement('a');
      a.href = selected.video_url; a.download = `${selected.title || 'network-video'}.mp4`; a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
      toast.success('تم فتح رابط التحميل');
    }
  };
  const toggleWatchLater = () => {
    if (!selected) return;
    setWatchLater(prev => {
      const has = prev.includes(selected.id);
      const next = has ? prev.filter(id => id !== selected.id) : [selected.id, ...prev];
      writeLS(LS_WATCHLATER, next);
      toast.success(has ? 'أُزيل من المشاهدة لاحقاً' : 'أُضيف إلى المشاهدة لاحقاً');
      return next;
    });
  };
  const toggleSubscribe = async () => {
    if (!userId || !selected) { toast.error('سجّل الدخول أولاً'); return; }
    if (selected.user_id === userId) { toast.error('لا يمكنك الاشتراك بنفسك'); return; }
    if (subscribed) {
      setSubscribed(false); setSubCount(c => Math.max(0, c - 1));
      setSubIds(ids => ids.filter(i => i !== selected.user_id));
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', selected.user_id);
    } else {
      setSubscribed(true); setSubCount(c => c + 1);
      setSubIds(ids => [selected.user_id, ...ids]);
      await supabase.from('follows').insert({ follower_id: userId, following_id: selected.user_id });
    }
  };
  const sendComment = async (parentContent?: string) => {
    if (!userId) { toast.error('سجّل الدخول أولاً'); return; }
    if (!selected) return;
    const text = (parentContent ?? commentInput).trim();
    if (!text) return;
    if (parentContent === undefined) setCommentInput('');
    const { data, error } = await supabase.from('video_comments')
      .insert({ video_id: selected.id, user_id: userId, content: text })
      .select('id, content, created_at, user_id').single();
    if (error) { toast.error('فشل إرسال التعليق'); return; }
    const { data: prof } = await supabase.from('profiles')
      .select('id, username, full_name, avatar_url').eq('id', userId).maybeSingle();
    setComments(prev => [{ ...(data as CommentRow), author: prof as any, likes: 0, replies: [] }, ...prev]);
  };
  const submitReply = (parentId: string) => {
    if (!replyText.trim()) return;
    setComments(prev => prev.map(c => c.id === parentId
      ? { ...c, replies: [...(c.replies || []), {
          id: `local-${Date.now()}`, content: replyText.trim(), created_at: new Date().toISOString(),
          user_id: userId || 'me', author: { username: me?.username || 'أنت', full_name: null, avatar_url: me?.avatar_url || null },
          likes: 0, replies: [],
        }] }
      : c));
    setReplyText(''); setReplyTo(null);
  };
  const toggleCommentLike = (id: string) => {
    setComments(prev => prev.map(c => c.id === id
      ? { ...c, liked: !c.liked, likes: (c.likes || 0) + (c.liked ? -1 : 1), disliked: false }
      : c));
  };
  const toggleCommentDislike = (id: string) => {
    setComments(prev => prev.map(c => c.id === id
      ? { ...c, disliked: !c.disliked, liked: false, likes: c.liked ? Math.max(0, (c.likes || 0) - 1) : c.likes }
      : c));
  };

  const showLive = sidebarKey === 'live' || activePill === 'live';

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* ============ TOP BAR ============ */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarCollapsed(s => !s)}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition">
            <Menu className="w-5 h-5" />
          </button>
          <button onClick={backHome} className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${NEON}33, transparent)`, boxShadow: `0 0 18px ${NEON}40` }}>
              <Tv className="w-5 h-5" style={{ color: NEON }} />
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold leading-tight">Networkk <span style={{ color: NEON }}>Cinema</span></div>
              <div className="text-[10px] text-white/40 leading-tight">منصة البث والفيديو</div>
            </div>
          </button>

          <div className="flex-1 max-w-2xl mx-auto flex items-center">
            <div className="flex-1 relative">
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث..." className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-r-full rounded-l-none h-10 pr-4" />
            </div>
            <button className="h-10 px-5 rounded-l-full rounded-r-none bg-white/[0.06] border border-r-0 border-white/[0.08] hover:bg-white/[0.1] transition">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setUploadOpen(true)}
            className="gap-2 rounded-full h-10 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white">
            <Upload className="w-4 h-4" /> رفع
          </Button>
          <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold ring-2"
            style={{ borderColor: NEON }}>
            {me?.avatar_url
              ? <img src={me.avatar_url} alt="" className="w-full h-full object-cover" />
              : (me?.username?.[0] || 'U').toUpperCase()}
          </div>
        </div>

        {mode === 'home' && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            {CATEGORY_PILLS.map(p => {
              const active = activePill === p.id;
              return (
                <button key={p.id} onClick={() => setActivePill(p.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active ? 'text-black border-transparent' : 'bg-white/[0.06] text-white/80 border-white/[0.08] hover:bg-white/[0.1]'
                  }`}
                  style={active ? { background: NEON, boxShadow: `0 0 14px ${NEON}55` } : undefined}>
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ============ BODY ============ */}
      <div className="flex" ref={scrollRef}>
        {/* SIDEBAR */}
        {!cinema && (
          <aside className={`sticky top-[3.5rem] shrink-0 self-start h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-none border-l border-white/[0.05] bg-black/70 backdrop-blur-xl transition-all ${
            sidebarCollapsed ? 'w-[72px]' : 'w-60'
          }`}>
            <nav className="py-3 px-2 space-y-0.5">
              {SIDEBAR_MAIN.map(it => {
                const Icon = it.icon; const active = sidebarKey === it.key;
                return (
                  <button key={it.key}
                    onClick={() => { setSidebarKey(it.key); setMode('home'); if (it.key === 'live') setActivePill('live'); else setActivePill('all'); }}
                    className={`w-full flex ${sidebarCollapsed ? 'flex-col py-3 gap-1' : 'items-center gap-4 px-3 py-2.5'} rounded-xl transition text-right ${
                      active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                    }`}
                    style={active ? { boxShadow: `inset 0 0 0 1px ${NEON}40` } : undefined}>
                    <Icon className={`w-5 h-5 shrink-0`} style={active ? { color: NEON } : undefined} />
                    <span className={`${sidebarCollapsed ? 'text-[10px]' : 'text-sm'} ${active ? 'font-semibold' : ''}`}>{it.label}</span>
                  </button>
                );
              })}
            </nav>

            {!sidebarCollapsed && (
              <>
                <div className="h-px bg-white/[0.06] mx-3 my-2" />
                <div className="px-4 pt-2 pb-1 text-[11px] text-white/40 font-semibold">أنت</div>
                <nav className="px-2 space-y-0.5">
                  {SIDEBAR_YOU.map(it => {
                    const Icon = it.icon; const active = sidebarKey === it.key;
                    return (
                      <button key={it.key}
                        onClick={() => { setSidebarKey(it.key); setMode('home'); setActivePill('all'); }}
                        className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition text-right ${
                          active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                        }`}
                        style={active ? { boxShadow: `inset 0 0 0 1px ${NEON}40` } : undefined}>
                        <Icon className="w-5 h-5" style={active ? { color: NEON } : undefined} />
                        <span className={`text-sm ${active ? 'font-semibold' : ''}`}>{it.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="h-px bg-white/[0.06] mx-3 my-2" />
                <div className="px-4 py-3 text-[10px] text-white/30 leading-relaxed">
                  © Network FZ-LLC<br />الشروط · الخصوصية · سياسة الأمان
                </div>
              </>
            )}
          </aside>
        )}

        {/* MAIN */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-24">
          {/* WATCH MODE */}
          {mode === 'watch' && selected ? (
            <div className={`grid gap-6 ${cinema ? 'grid-cols-1 max-w-[1600px] mx-auto' : 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]'}`}>
              <div className="min-w-0">
                <button onClick={backHome}
                  className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition">
                  <ArrowRight className="w-4 h-4" /> عودة للفيديوهات
                </button>

                <SmartPlayer video={selected} cinema={cinema} />

                <h1 className="mt-4 text-xl font-bold leading-snug">{selected.title}</h1>

                {/* Creator row + engagement */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-sm font-bold">
                      {selected.uploader?.avatar_url
                        ? <img src={selected.uploader.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (selected.uploader?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {selected.uploader?.full_name || selected.uploader?.username || 'مستخدم'}
                      </div>
                      <div className="text-[11px] text-white/50">{formatCount(subCount)} مشترك</div>
                    </div>
                    <Button onClick={toggleSubscribe}
                      className={`rounded-full h-9 px-5 font-bold ${
                        subscribed
                          ? 'bg-white/[0.08] text-white/80 hover:bg-white/[0.12] border border-white/10'
                          : 'text-black hover:opacity-90'
                      }`}
                      style={!subscribed ? { background: NEON, boxShadow: `0 0 18px ${NEON}66` } : undefined}>
                      {subscribed ? 'مشترك' : 'اشتراك'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <div className="flex items-center rounded-full bg-white/[0.06] border border-white/[0.08]">
                      <button onClick={handleLike}
                        className={`flex items-center gap-2 h-9 pr-4 pl-3 border-l border-white/[0.08] transition ${
                          liked ? '' : 'hover:bg-white/[0.05]'
                        }`}
                        style={liked ? { color: NEON } : undefined}>
                        <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{formatCount(likeCount)}</span>
                      </button>
                      <button onClick={handleDislike}
                        className={`h-9 px-4 transition ${disliked ? 'text-white' : 'hover:bg-white/[0.05]'}`}>
                        <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <Button onClick={handleShare} variant="outline"
                      className="rounded-full gap-2 bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]">
                      <Share2 className="w-4 h-4" /> مشاركة
                    </Button>
                    <Button onClick={handleDownload} variant="outline"
                      className="rounded-full gap-2 bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]">
                      <Download className="w-4 h-4" /> تحميل
                    </Button>
                    <Button onClick={toggleWatchLater} variant="outline"
                      className="rounded-full gap-2 bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]">
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setCinema(c => !c)} variant="outline"
                      className="rounded-full bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]" title="Cinema Mode">
                      {cinema ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline"
                          className="rounded-full w-9 h-9 p-0 bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/[0.08] text-white">
                        <DropdownMenuItem onClick={handleDownload} className="gap-2 cursor-pointer focus:bg-white/[0.08] focus:text-white">
                          <Download className="w-4 h-4" />
                          تحميل الفيديو
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4 rounded-xl bg-white/[0.05] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-3 text-xs text-white/70 font-semibold">
                    <span>{formatCount(selected.views_count || 0)} مشاهدة</span>
                    <span>{timeAgo(selected.created_at)}</span>
                    {selected.category && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06]" style={{ color: NEON }}>#{selected.category}</span>
                    )}
                  </div>
                  <div className={`mt-2 text-sm text-white/80 whitespace-pre-wrap ${descExpanded ? '' : 'line-clamp-3'}`}>
                    {selected.description || 'لا يوجد وصف.'}
                  </div>
                  <button onClick={() => setDescExpanded(e => !e)}
                    className="mt-2 text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1">
                    {descExpanded ? <>عرض أقل <ChevronUp className="w-3 h-3" /></> : <>عرض المزيد <ChevronDown className="w-3 h-3" /></>}
                  </button>
                </div>

                {/* Comments */}
                <section className="mt-6">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" style={{ color: NEON }} />
                    {comments.length} تعليق
                  </h3>
                  <div className="flex gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
                      {me?.avatar_url
                        ? <img src={me.avatar_url} alt="" className="w-full h-full object-cover" />
                        : (me?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Input value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                        placeholder={userId ? 'أضف تعليقاً عاماً...' : 'سجّل الدخول للتعليق'} disabled={!userId}
                        className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus-visible:ring-0 focus-visible:border-b-2"
                        style={commentInput ? { borderBottomColor: NEON } : undefined} />
                      {commentInput && (
                        <div className="flex justify-end gap-2 mt-2">
                          <Button size="sm" variant="ghost" onClick={() => setCommentInput('')}
                            className="rounded-full text-white/70 hover:bg-white/10">إلغاء</Button>
                          <Button size="sm" onClick={() => sendComment()}
                            className="rounded-full text-black font-bold" style={{ background: NEON }}>
                            تعليق
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-5">
                    {comments.length === 0 && <p className="text-sm text-white/40 text-center py-8">كن أول من يعلّق</p>}
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
                          {c.author?.avatar_url
                            ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (c.author?.username?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold">@{c.author?.username || c.author?.full_name || 'مستخدم'}</span>
                            <span className="text-white/40">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-white/90 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button onClick={() => toggleCommentLike(c.id)}
                              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
                              style={c.liked ? { color: NEON } : undefined}>
                              <ThumbsUp className={`w-3.5 h-3.5 ${c.liked ? 'fill-current' : ''}`} />
                            </button>
                            {(c.likes || 0) > 0 && <span className="text-[11px] text-white/60">{c.likes}</span>}
                            <button onClick={() => toggleCommentDislike(c.id)}
                              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition ml-1">
                              <ThumbsDown className={`w-3.5 h-3.5 ${c.disliked ? 'fill-current' : ''}`} />
                            </button>
                            <button onClick={() => setReplyTo(c.id === replyTo ? null : c.id)}
                              className="ml-2 text-[11px] font-semibold text-white/70 hover:text-white px-3 h-8 rounded-full hover:bg-white/10">
                              رد
                            </button>
                          </div>
                          {replyTo === c.id && (
                            <div className="flex gap-2 mt-2">
                              <Input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitReply(c.id)}
                                placeholder="اكتب رداً..."
                                className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 h-8 text-sm" />
                              <Button size="sm" onClick={() => submitReply(c.id)}
                                className="rounded-full text-black font-bold" style={{ background: NEON }}>
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                          {c.replies && c.replies.length > 0 && (
                            <div className="mt-3 space-y-3 pr-4 border-r border-white/10">
                              {c.replies.map(r => (
                                <div key={r.id} className="flex gap-2">
                                  <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {r.author?.avatar_url
                                      ? <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                      : (r.author?.username?.[0] || '?').toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px]">
                                      <span className="font-semibold">@{r.author?.username || 'أنت'}</span>
                                      <span className="text-white/40 mr-2">{timeAgo(r.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-white/90 mt-0.5 break-words">{r.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* UP NEXT */}
              {!cinema && (
                <aside className="min-w-0">
                  <div className="text-sm font-bold mb-3 px-1">التالي</div>
                  <div className="space-y-1">
                    {upNext.map(v => (
                      <VideoCard key={v.id} v={v} onSelect={openWatch} layout="row" />
                    ))}
                  </div>
                </aside>
              )}
            </div>
          ) : showLive ? (
            /* LIVE MATCHES */
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5" style={{ color: '#ef4444' }} /> البث المباشر
              </h2>
              {matches.length === 0 ? (
                <p className="text-center text-white/40 py-16">لا توجد مباريات حالياً</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map(m => (
                    <div key={m.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden hover:bg-white/[0.07] transition">
                      <div className="relative aspect-video bg-black/60">
                        {m.thumbnail_url
                          ? <img src={m.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Trophy className="w-10 h-10 text-white/10" /></div>}
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className={
                            m.status === 'live' ? 'border-red-500/40 text-red-400 bg-red-500/20 backdrop-blur'
                            : m.status === 'ended' ? 'border-white/20 text-white/60 bg-black/40 backdrop-blur'
                            : 'border-[#08A045]/40 text-[#08A045] bg-black/40 backdrop-blur'}>
                            {m.status === 'live' && <Radio className="w-3 h-3 ml-1 animate-pulse" />}
                            {m.status === 'live' ? 'مباشر' : m.status === 'ended' ? 'انتهت' : 'قادمة'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                        <span className="text-xs text-white/40">{m.league || '—'}</span>
                        <div className="text-base font-semibold leading-tight">
                          {m.home_team} <span className="text-white/30">vs</span> {m.away_team}
                        </div>
                        <Button onClick={() => m.stream_url && window.open(m.stream_url, '_blank')}
                          disabled={!m.stream_url} className="bg-[#08A045] hover:bg-[#08A045]/90 text-white font-bold gap-2">
                          <Play className="w-4 h-4 fill-white" />
                          {m.stream_url ? 'مشاهدة' : 'لا يوجد بث'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            /* HOME GRID */
            <section>
              {sidebarKey !== 'home' && (
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: NEON }} />
                  {SIDEBAR_MAIN.concat(SIDEBAR_YOU).find(s => s.key === sidebarKey)?.label}
                </h2>
              )}
              {filteredVideos.length === 0 ? (
                <div className="text-center py-20">
                  <Film className="w-16 h-16 mx-auto text-white/10 mb-4" />
                  <p className="text-white/40">لا توجد فيديوهات هنا بعد</p>
                </div>
              ) : (
                <div className={`grid gap-x-4 gap-y-8 ${sidebarKey === 'shorts'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                  {filteredVideos.map(v => <VideoCard key={v.id} v={v} onSelect={openWatch} />)}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <CinemaUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={() => loadVideos()} />
    </div>
  );
};

export default NetworkTV;
