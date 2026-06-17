import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Radio, Trophy, Play, Upload, Heart, Share2, Eye, MessageCircle,
  Maximize2, Minimize2, Send, Tv, Music2, Gamepad2, Newspaper,
  Film, GraduationCap, Sparkles, Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { CinemaUploadModal } from '@/components/cinema/CinemaUploadModal';
import HlsPlayer from '@/components/HlsPlayer';

const NEON = '#39FF14';
const EMERALD = '#08A045';

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
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  start_time: string;
  status: string;
  stream_url: string | null;
  thumbnail_url: string | null;
}

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: Sparkles },
  { id: 'live', label: 'مباشر', icon: Radio },
  { id: 'trending', label: 'رائج', icon: Flame },
  { id: 'music', label: 'موسيقى', icon: Music2 },
  { id: 'gaming', label: 'ألعاب', icon: Gamepad2 },
  { id: 'news', label: 'أخبار', icon: Newspaper },
  { id: 'sports', label: 'رياضة', icon: Trophy },
  { id: 'movies', label: 'أفلام', icon: Film },
  { id: 'education', label: 'تعليم', icon: GraduationCap },
  { id: 'entertainment', label: 'ترفيه', icon: Tv },
];

const formatCount = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const getYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
};

const isHls = (url: string) => /\.m3u8(\?|$)/i.test(url);

const SmartPlayer = ({ video, cinema }: { video: Video; cinema: boolean }) => {
  const yt = getYouTubeId(video.video_url);
  const cls = `w-full ${cinema ? 'aspect-video max-h-[80vh]' : 'aspect-video'} bg-black rounded-2xl overflow-hidden`;
  if (yt) {
    return (
      <div className={cls}>
        <iframe
          key={yt}
          src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          className="w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  if (isHls(video.video_url)) {
    return (
      <div className={cls}>
        <HlsPlayer src={video.video_url} poster={video.thumbnail_url || undefined} className="w-full h-full object-contain bg-black" />
      </div>
    );
  }
  return (
    <div className={cls}>
      <video
        key={video.id}
        src={video.video_url}
        poster={video.thumbnail_url || undefined}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black"
      />
    </div>
  );
};

const NetworkTV = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Video | null>(null);
  const [cinema, setCinema] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const playerScrollRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load videos
  const loadVideos = useCallback(async () => {
    const { data } = await supabase
      .from('videos')
      .select('id,title,description,category,video_url,thumbnail_url,duration,views_count,likes_count,comments_count,created_at,user_id')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(60);
    const rows = (data as Video[]) || [];
    const ids = Array.from(new Set(rows.map(v => v.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      rows.forEach(v => { v.uploader = map.get(v.user_id) as any; });
    }
    setVideos(rows);
    setLoading(false);
    setSelected(prev => prev ?? rows[0] ?? null);
  }, []);

  const loadMatches = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select('id, home_team, away_team, league, start_time, status, stream_url, thumbnail_url')
      .order('start_time', { ascending: false });
    setMatches((data as Match[]) || []);
  }, []);

  useEffect(() => {
    loadVideos();
    loadMatches();
    const ch1 = supabase.channel('ntv-videos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, loadVideos)
      .subscribe();
    const ch2 = supabase.channel('ntv-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, loadMatches)
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [loadVideos, loadMatches]);

  // Selected video side-effects: load comments, like state, register view
  useEffect(() => {
    if (!selected) return;
    setLikeCount(selected.likes_count || 0);
    setLiked(false);

    (async () => {
      const { data: cs } = await supabase
        .from('video_comments')
        .select('id, content, created_at, user_id')
        .eq('video_id', selected.id)
        .order('created_at', { ascending: false })
        .limit(50);
      const rows = (cs as CommentRow[]) || [];
      const ids = Array.from(new Set(rows.map(r => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles').select('id, username, full_name, avatar_url').in('id', ids);
        const map = new Map((profs || []).map((p: any) => [p.id, p]));
        rows.forEach(r => { r.author = map.get(r.user_id) as any; });
      }
      setComments(rows);

      if (userId) {
        const { data: lk } = await supabase
          .from('video_likes').select('id').eq('video_id', selected.id).eq('user_id', userId).maybeSingle();
        setLiked(!!lk);
      }
    })();

    // Optimistic view bump after 5s
    const t = setTimeout(async () => {
      await supabase.from('videos')
        .update({ views_count: (selected.views_count || 0) + 1 })
        .eq('id', selected.id);
    }, 5000);
    return () => clearTimeout(t);
  }, [selected?.id, userId]);

  const filteredVideos = useMemo(() => {
    let list = videos;
    if (activeCat === 'trending') {
      list = [...list].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (activeCat !== 'all' && activeCat !== 'live') {
      list = list.filter(v => v.category === activeCat);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(v =>
        v.title.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [videos, activeCat, query]);

  const related = useMemo(() => {
    if (!selected) return videos.slice(0, 12);
    return videos.filter(v => v.id !== selected.id).slice(0, 12);
  }, [videos, selected]);

  const handleLike = async () => {
    if (!userId || !selected) { toast.error('سجّل الدخول أولاً'); return; }
    if (liked) {
      setLiked(false); setLikeCount(c => Math.max(0, c - 1));
      await supabase.from('video_likes').delete().eq('video_id', selected.id).eq('user_id', userId);
    } else {
      setLiked(true); setLikeCount(c => c + 1);
      await supabase.from('video_likes').insert({ video_id: selected.id, user_id: userId });
    }
  };

  const handleShare = async () => {
    if (!selected) return;
    const url = `${window.location.origin}/network-tv?v=${selected.id}`;
    try {
      if (navigator.share) await navigator.share({ title: selected.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('تم نسخ الرابط'); }
    } catch {/* ignore */}
  };

  const sendComment = async () => {
    if (!userId) { toast.error('سجّل الدخول أولاً'); return; }
    if (!selected || !commentInput.trim()) return;
    const content = commentInput.trim();
    setCommentInput('');
    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: selected.id, user_id: userId, content })
      .select('id, content, created_at, user_id').single();
    if (error) { toast.error('فشل إرسال التعليق'); return; }
    const { data: prof } = await supabase
      .from('profiles').select('id, username, full_name, avatar_url').eq('id', userId).maybeSingle();
    setComments(prev => [{ ...(data as CommentRow), author: prof as any }, ...prev]);
  };

  const selectVideo = (v: Video) => {
    setSelected(v);
    playerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showingLive = activeCat === 'live';

  return (
    <div className="min-h-screen bg-black text-white pb-24" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${NEON}33, transparent)`, boxShadow: `0 0 18px ${NEON}40` }}>
              <Tv className="w-5 h-5" style={{ color: NEON }} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Networkk TV</h1>
              <p className="text-[10px] text-white/40 leading-tight">منصة البث والفيديو</p>
            </div>
          </div>
          <div className="flex-1 max-w-xl mx-auto">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن فيديوهات..."
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 rounded-full h-10"
            />
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="gap-2 text-black font-bold rounded-full h-10"
            style={{ background: `linear-gradient(135deg, ${NEON}, #00FF88)`, boxShadow: `0 0 20px ${NEON}55` }}
          >
            <Upload className="w-4 h-4" /> رفع
          </Button>
        </div>

        {/* Category chips */}
        <div className="max-w-[1600px] mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all ${
                  active
                    ? 'text-black border-transparent'
                    : 'bg-white/[0.04] text-white/70 border-white/[0.06] hover:bg-white/[0.08]'
                }`}
                style={active ? { background: NEON, boxShadow: `0 0 14px ${NEON}55` } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 pt-6">
        {showingLive ? (
          /* LIVE MATCHES GRID */
          <section>
            {matches.length === 0 ? (
              <p className="text-center text-white/40 py-16">لا توجد مباريات حالياً</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(m => (
                  <div key={m.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl overflow-hidden hover:bg-white/[0.07] transition">
                    <div className="relative aspect-video bg-black/60">
                      {m.thumbnail_url ? (
                        <img src={m.thumbnail_url} alt={`${m.home_team} vs ${m.away_team}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Trophy className="w-10 h-10 text-white/10" /></div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className={
                          m.status === 'live'
                            ? 'border-red-500/40 text-red-400 bg-red-500/20 backdrop-blur'
                            : m.status === 'ended'
                            ? 'border-white/20 text-white/60 bg-black/40 backdrop-blur'
                            : 'border-[#08A045]/40 text-[#08A045] bg-black/40 backdrop-blur'
                        }>
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
                      <Button
                        onClick={() => m.stream_url && window.open(m.stream_url, '_blank')}
                        disabled={!m.stream_url}
                        className="bg-[#08A045] hover:bg-[#08A045]/90 text-white font-bold gap-2"
                      >
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
          /* YOUTUBE-LIKE LAYOUT */
          <div className={`grid gap-6 ${cinema ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_360px]'}`}>
            {/* Player + meta + comments */}
            <div ref={playerScrollRef} className="min-w-0">
              {loading ? (
                <div className="aspect-video rounded-2xl bg-white/[0.04] animate-pulse" />
              ) : selected ? (
                <>
                  <SmartPlayer video={selected} cinema={cinema} />

                  {/* Title + actions */}
                  <div className="mt-4">
                    <h2 className="text-xl font-bold leading-snug">{selected.title}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-sm font-bold">
                          {selected.uploader?.avatar_url
                            ? <img src={selected.uploader.avatar_url} alt="" className="w-full h-full object-cover" />
                            : (selected.uploader?.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {selected.uploader?.full_name || selected.uploader?.username || 'مستخدم'}
                          </div>
                          <div className="text-[11px] text-white/40 flex items-center gap-2">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(selected.views_count || 0)} مشاهدة</span>
                            <span>•</span>
                            <span>{new Date(selected.created_at).toLocaleDateString('ar')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mr-auto">
                        <Button
                          onClick={handleLike}
                          variant="outline"
                          className={`rounded-full gap-2 border-white/10 ${liked ? 'text-red-400 border-red-500/40 bg-red-500/10' : 'bg-white/[0.05] text-white'}`}
                        >
                          <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
                          {formatCount(likeCount)}
                        </Button>
                        <Button onClick={handleShare} variant="outline" className="rounded-full gap-2 bg-white/[0.05] border-white/10 text-white">
                          <Share2 className="w-4 h-4" /> مشاركة
                        </Button>
                        <Button
                          onClick={() => setCinema(c => !c)}
                          variant="outline"
                          className="rounded-full gap-2 bg-white/[0.05] border-white/10 text-white"
                          title="Cinema Mode"
                        >
                          {cinema ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          {cinema ? 'إغلاق' : 'سينما'}
                        </Button>
                      </div>
                    </div>

                    {selected.description && (
                      <div className="mt-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 whitespace-pre-wrap">
                        {selected.description}
                      </div>
                    )}
                  </div>

                  {/* Comments */}
                  <section className="mt-6">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" style={{ color: NEON }} />
                      التعليقات ({comments.length})
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                        placeholder={userId ? 'أضف تعليقاً...' : 'سجّل الدخول للتعليق'}
                        disabled={!userId}
                        className="bg-white/[0.04] border-white/[0.08] rounded-full"
                      />
                      <Button onClick={sendComment} disabled={!commentInput.trim() || !userId}
                        className="rounded-full text-black font-bold"
                        style={{ background: NEON }}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {comments.length === 0 && (
                        <p className="text-sm text-white/40 text-center py-6">كن أول من يعلّق</p>
                      )}
                      {comments.map(c => (
                        <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
                            {c.author?.avatar_url
                              ? <img src={c.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              : (c.author?.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold">{c.author?.full_name || c.author?.username || 'مستخدم'}</span>
                              <span className="text-white/30">{new Date(c.created_at).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <p className="text-sm text-white/85 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="aspect-video rounded-2xl bg-white/[0.04] flex items-center justify-center text-white/40">
                  لا توجد فيديوهات بعد — كن أول من يرفع
                </div>
              )}
            </div>

            {/* Related sidebar */}
            {!cinema && (
              <aside className="space-y-3 min-w-0">
                <h3 className="text-sm font-bold text-white/80 px-1">
                  {activeCat === 'all' ? 'فيديوهات مقترحة' : `${CATEGORIES.find(c => c.id === activeCat)?.label || ''}`}
                </h3>
                {filteredVideos.length === 0 ? (
                  <p className="text-sm text-white/40 px-1">لا توجد نتائج</p>
                ) : (
                  (related.length ? related : filteredVideos).map(v => (
                    <button
                      key={v.id}
                      onClick={() => selectVideo(v)}
                      className={`w-full text-right flex gap-3 p-2 rounded-xl transition border ${
                        selected?.id === v.id
                          ? 'bg-white/[0.08] border-white/20'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-black/60 shrink-0">
                        {v.thumbnail_url ? (
                          <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Film className="w-6 h-6 text-white/20" /></div>
                        )}
                        {v.duration ? (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-black/80">
                            {Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, '0')}
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold leading-snug line-clamp-2">{v.title}</div>
                        <div className="text-[10px] text-white/40 mt-1 truncate">
                          {v.uploader?.full_name || v.uploader?.username || 'مستخدم'}
                        </div>
                        <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                          <Eye className="w-2.5 h-2.5" /> {formatCount(v.views_count || 0)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </aside>
            )}
          </div>
        )}

        {/* Bottom feed grid (when not Live tab and there are extra videos beyond related) */}
        {!showingLive && !cinema && filteredVideos.length > 0 && (
          <section className="mt-12">
            <h3 className="text-sm font-bold mb-4 text-white/80 flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: NEON }} /> استكشف المزيد
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVideo(v)}
                  className="group text-right rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition"
                >
                  <div className="relative aspect-video bg-black/60">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Film className="w-8 h-8 text-white/15" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                      <Play className="w-10 h-10 fill-white text-white" />
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-semibold line-clamp-2 leading-snug">{v.title}</div>
                    <div className="text-[10px] text-white/40 mt-1 truncate">
                      {v.uploader?.full_name || v.uploader?.username || 'مستخدم'}
                    </div>
                    <div className="text-[10px] text-white/40 flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5" /> {formatCount(v.views_count || 0)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <CinemaUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={() => loadVideos()} />
    </div>
  );
};

export default NetworkTV;
