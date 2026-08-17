import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Bookmark, Flag, Gauge, Maximize, Minimize, Pause, PictureInPicture2,
  Play, Send, Settings2, Share2, ThumbsDown, ThumbsUp, Volume2, VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import TvTopBar from '@/components/networktv/TvTopBar';
import VideoCard, { VideoCardSkeleton } from '@/components/networktv/VideoCard';
import { useCurrentUserId, useTvComments, useTvRecommended, useTvVideo } from '@/hooks/useNetworkTv';
import { TV_ACCENT, formatCount, formatDuration, isHls, timeAgo } from '@/lib/networkTv';
import { displayedFollowers } from '@/lib/followerDisplay';
import { cn } from '@/lib/utils';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Watch = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const userId = useCurrentUserId();

  const { data: video, isLoading, error } = useTvVideo(videoId);
  const { data: recommended } = useTvRecommended(videoId, video?.category);
  const { data: comments, invalidate: reloadComments } = useTvComments(videoId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const viewSent = useRef(false);
  const watched = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controls, setControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [levels, setLevels] = useState<{ id: number; label: string }[]>([]);
  const [level, setLevel] = useState(-1);
  const [settings, setSettings] = useState(false);
  const [theater, setTheater] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const likeBusy = useRef(false);
  const [descOpen, setDescOpen] = useState(false);
  const [search, setSearch] = useState('');

  /* ── media source (HLS or MP4) ── */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !video?.video_url) return;
    let cancelled = false;
    setLevels([]);
    setLevel(-1);

    const setup = async () => {
      if (isHls(video.video_url) && !el.canPlayType('application/vnd.apple.mpegurl')) {
        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(video.video_url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLevels(hls.levels.map((l: any, i: number) => ({ id: i, label: `${l.height || l.bitrate}p` })));
          });
          return;
        }
      }
      el.src = video.video_url;
    };
    setup();

    return () => {
      cancelled = true;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [video?.video_url]);

  /* ── likes / follow state ── */
  useEffect(() => {
    if (!video) return;
    setLikes(Number(video.likes_count || 0));
    if (!userId) return;
    (async () => {
      const [{ data: like }, { data: follow }] = await Promise.all([
        supabase.from('video_likes').select('id').eq('video_id', video.id).eq('user_id', userId).maybeSingle(),
        supabase.from('follows').select('id').eq('follower_id', userId).eq('following_id', video.user_id).maybeSingle(),
      ]);
      setLiked(!!like);
      setFollowing(!!follow);
    })();
  }, [video, userId]);

  /* ── resume playback ── */
  useEffect(() => {
    if (!userId || !videoId) return;
    (supabase as any)
      .from('video_watch_history')
      .select('position_seconds')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.position_seconds > 5 && videoRef.current) videoRef.current.currentTime = data.position_seconds;
      });
  }, [userId, videoId]);

  /* ── persist position + record real view (server-side, spam-safe) ── */
  useEffect(() => {
    if (!videoId) return;
    const int = setInterval(async () => {
      const el = videoRef.current;
      if (!el || el.paused) return;
      watched.current += 5;

      if (!viewSent.current && watched.current >= 15) {
        viewSent.current = true;
        await (supabase as any).rpc('record_video_view', {
          _video_id: videoId,
          _watch_seconds: Math.round(watched.current),
          _device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          _source: 'network_tv',
        });
      }
      if (userId) {
        await (supabase as any)
          .from('video_watch_history')
          .upsert({ user_id: userId, video_id: videoId, position_seconds: Math.round(el.currentTime), updated_at: new Date().toISOString() }, { onConflict: 'user_id,video_id' });
      }
    }, 5000);
    return () => clearInterval(int);
  }, [videoId, userId]);

  useEffect(() => {
    viewSent.current = false;
    watched.current = 0;
    window.scrollTo({ top: 0 });
  }, [videoId]);

  const showControls = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 2800);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); } else { el.pause(); setPlaying(false); }
    showControls();
  }, [showControls]);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * (el.duration || 0);
  };

  const toggleFullscreen = () => {
    const node = wrapRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else (node.requestFullscreen?.() as Promise<void> | undefined)?.catch(() => {
      (videoRef.current as any)?.webkitEnterFullscreen?.();
    });
  };

  const togglePip = async () => {
    const el = videoRef.current as any;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) await (document as any).exitPictureInPicture();
      else if (el.requestPictureInPicture) await el.requestPictureInPicture();
      else toast.error('غير مدعوم على هذا الجهاز');
    } catch { toast.error('تعذر تفعيل صورة داخل صورة'); }
  };

  const toggleLike = async () => {
    if (!userId || !video) return toast.error('يجب تسجيل الدخول');
    if (likeBusy.current) return;
    likeBusy.current = true;
    const next = !liked;
    setLiked(next);
    setDisliked(false);
    setLikes((c) => Math.max(0, c + (next ? 1 : -1)));
    const { error: err } = next
      ? await supabase.from('video_likes').insert({ video_id: video.id, user_id: userId })
      : await supabase.from('video_likes').delete().eq('video_id', video.id).eq('user_id', userId);
    if (err && !String(err.message || '').includes('duplicate')) {
      setLiked(!next);
      setLikes((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error('تعذر تنفيذ العملية');
    }
    likeBusy.current = false;
  };


  const toggleFollow = async () => {
    if (!userId || !video) return toast.error('يجب تسجيل الدخول');
    if (userId === video.user_id) return;
    setBusy(true);
    const was = following;
    setFollowing(!was);
    const { error: err } = was
      ? await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', video.user_id)
      : await supabase.from('follows').insert({ follower_id: userId, following_id: video.user_id });
    if (err) { setFollowing(was); toast.error('حدث خطأ، حاول مجدداً'); }
    setBusy(false);
  };

  const share = async () => {
    const url = `${window.location.origin}/network-tv/watch/${videoId}`;
    try {
      if (navigator.share) await navigator.share({ title: video?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('تم نسخ الرابط'); }
    } catch { /* cancelled */ }
  };

  const save = async () => {
    if (!userId) return toast.error('يجب تسجيل الدخول');
    const { error: err } = await (supabase as any).from('video_saves').insert({ user_id: userId, video_id: videoId, kind: 'save' });
    if (err && !String(err.message).includes('duplicate')) toast.error('تعذر الحفظ');
    else toast.success('تم الحفظ');
  };

  const report = async () => {
    if (!userId || !video) return toast.error('يجب تسجيل الدخول');
    await supabase.from('reports').insert({
      reporter_id: userId,
      reported_user_id: video.user_id,
      report_type: 'video',
      report_reason: 'inappropriate_content',
      additional_details: `video:${video.id}`,
    } as any);
    toast.success('تم إرسال البلاغ');
  };

  const submitComment = async () => {
    const text = newComment.trim();
    if (!text || !videoId) return;
    if (!userId) return toast.error('يجب تسجيل الدخول');
    if (sendingComment) return;
    setSendingComment(true);
    setNewComment('');
    const { error: err } = await (supabase as any).from('video_comments').insert({ video_id: videoId, user_id: userId, content: text });
    setSendingComment(false);
    if (err) { setNewComment(text); toast.error('تعذر إضافة التعليق'); }
    else reloadComments();
  };

  const followerText = useMemo(() => formatCount(displayedFollowers(video?.uploader as any)), [video?.uploader]);
  const restricted = !isLoading && !video;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black" dir="rtl">
        <TvTopBar search={search} onSearchChange={setSearch} />
        <div className="mx-auto max-w-[1800px] px-3 pt-4 sm:px-5">
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-white/[0.05]" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-white/[0.05]" />
        </div>
      </div>
    );
  }

  if (restricted) {
    return (
      <div className="min-h-screen bg-black" dir="rtl">
        <TvTopBar search={search} onSearchChange={setSearch} />
        <div className="grid min-h-[60vh] place-items-center px-6 text-center">
          <div>
            <p className="text-sm text-foreground/60">هذا الفيديو غير متاح لك أو تمت إزالته.</p>
            <button onClick={() => navigate('/network-tv')} className="mt-4 rounded-full px-5 py-2 text-[13px] font-semibold text-black" style={{ background: TV_ACCENT }}>
              العودة إلى Network TV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const v = video!;

  return (
    <div className="min-h-screen bg-black text-foreground" dir="rtl">
      <TvTopBar search={search} onSearchChange={(s) => { setSearch(s); if (s.trim()) navigate('/network-tv'); }} />

      <main
        className={cn('mx-auto w-full px-3 pt-4 sm:px-5', theater ? 'max-w-[1800px]' : 'max-w-[1600px]')}
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
      >
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-[13px] text-foreground/60 hover:text-foreground lg:hidden">
          <ArrowRight className="h-4 w-4" /> رجوع
        </button>

        <div className={cn('flex flex-col gap-6', !theater && 'xl:flex-row')}>
          <div className="min-w-0 flex-1">
            {/* Player */}
            <div
              ref={wrapRef}
              className="relative w-full overflow-hidden bg-black"
              style={{ borderRadius: 16, boxShadow: `0 0 40px ${TV_ACCENT}18` }}
              onMouseMove={showControls}
              onTouchStart={showControls}
            >
              <video
                ref={videoRef}
                poster={v.thumbnail_url || undefined}
                playsInline
                className="aspect-video w-full bg-black object-contain"
                onClick={togglePlay}
                onTimeUpdate={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  setCurrent(el.currentTime);
                  setProgress((el.currentTime / (el.duration || 1)) * 100);
                }}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                  const next = (recommended || [])[0];
                  if (next) navigate(`/network-tv/watch/${next.id}`);
                }}
              />

              <div className={cn('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300', controls ? 'opacity-100' : 'opacity-0')}>
                <div className="mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/20" onClick={seek}>
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: TV_ACCENT }} />
                </div>
                <div className="flex items-center gap-2 text-white" dir="ltr">
                  <button onClick={togglePlay} aria-label="تشغيل" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button onClick={() => { const el = videoRef.current; if (el) { el.muted = !el.muted; setMuted(el.muted); } }} aria-label="الصوت" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <span className="text-[11px] tabular-nums text-white/80">{formatDuration(current)} / {formatDuration(duration)}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="relative">
                      <button onClick={() => setSettings((s) => !s)} aria-label="الإعدادات" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
                        <Settings2 className="h-5 w-5" />
                      </button>
                      {settings && (
                        <div className="absolute bottom-11 right-0 w-44 rounded-xl border border-white/10 bg-black/95 p-2 text-right backdrop-blur-xl" dir="rtl">
                          <p className="px-2 pb-1 text-[11px] text-white/50"><Gauge className="ms-1 inline h-3 w-3" /> السرعة</p>
                          <div className="flex flex-wrap gap-1 px-1 pb-2">
                            {SPEEDS.map((s) => (
                              <button
                                key={s}
                                onClick={() => { setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
                                className={cn('rounded-md px-2 py-1 text-[11px]', speed === s ? 'text-black' : 'bg-white/10 text-white/80')}
                                style={speed === s ? { background: TV_ACCENT } : undefined}
                              >{s}x</button>
                            ))}
                          </div>
                          {levels.length > 0 && (
                            <>
                              <p className="px-2 pb-1 text-[11px] text-white/50">الجودة</p>
                              <div className="flex flex-wrap gap-1 px-1">
                                <button onClick={() => { setLevel(-1); if (hlsRef.current) hlsRef.current.currentLevel = -1; }} className={cn('rounded-md px-2 py-1 text-[11px]', level === -1 ? 'text-black' : 'bg-white/10 text-white/80')} style={level === -1 ? { background: TV_ACCENT } : undefined}>تلقائي</button>
                                {levels.map((l) => (
                                  <button key={l.id} onClick={() => { setLevel(l.id); if (hlsRef.current) hlsRef.current.currentLevel = l.id; }} className={cn('rounded-md px-2 py-1 text-[11px]', level === l.id ? 'text-black' : 'bg-white/10 text-white/80')} style={level === l.id ? { background: TV_ACCENT } : undefined}>{l.label}</button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={togglePip} aria-label="صورة داخل صورة" className="hidden h-9 w-9 place-items-center rounded-full hover:bg-white/10 sm:grid">
                      <PictureInPicture2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => setTheater((t) => !t)} aria-label="وضع المسرح" className="hidden h-9 w-9 place-items-center rounded-full hover:bg-white/10 lg:grid">
                      {theater ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </button>
                    <button onClick={toggleFullscreen} aria-label="ملء الشاشة" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <h1 className="mt-4 text-[17px] font-bold leading-snug sm:text-[19px]">{v.title}</h1>
            <p className="mt-1 text-[12px] text-foreground/50">
              {formatCount(v.views_count)} مشاهدة · {timeAgo(v.published_at || v.created_at)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-white/[0.05] p-1 ps-3">
                <button onClick={toggleLike} className="flex items-center gap-1.5 text-[13px]">
                  <ThumbsUp className={cn('h-4 w-4', liked && 'fill-current')} style={liked ? { color: TV_ACCENT } : undefined} />
                  {formatCount(likes)}
                </button>
                <span className="h-4 w-px bg-white/15" />
                <button onClick={() => { setDisliked((d) => !d); if (liked) { setLiked(false); setLikes((c) => Math.max(0, c - 1)); } }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/[0.07]" aria-label="لم يعجبني">
                  <ThumbsDown className={cn('h-4 w-4', disliked && 'text-red-400')} />
                </button>
              </div>
              {v.allow_sharing !== false && (
                <button onClick={share} className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-4 py-2 text-[13px] hover:bg-white/[0.09]">
                  <Share2 className="h-4 w-4" /> مشاركة
                </button>
              )}
              <button onClick={save} className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-4 py-2 text-[13px] hover:bg-white/[0.09]">
                <Bookmark className="h-4 w-4" /> حفظ
              </button>
              <button onClick={report} className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-4 py-2 text-[13px] text-red-400 hover:bg-white/[0.09]">
                <Flag className="h-4 w-4" /> إبلاغ
              </button>
            </div>

            {/* Creator */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <button onClick={() => navigate(`/profile/${v.user_id}`)}>
                {v.uploader?.avatar_url ? (
                  <img src={v.uploader.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.08]">{(v.uploader?.username || '?').charAt(0)}</span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/profile/${v.user_id}`)} className="truncate text-[14px] font-semibold">
                    {v.uploader?.full_name || v.uploader?.username || 'مستخدم'}
                  </button>
                  {v.uploader?.is_verified && <VerifiedBadge size="sm" verificationType={(v.uploader.verification_type as any) || null} userId={v.uploader.id} />}
                </div>
                <p className="text-[12px] text-foreground/50">{followerText} متابع</p>
              </div>
              {userId !== v.user_id && (
                <button
                  onClick={toggleFollow}
                  disabled={busy}
                  className={cn('rounded-full px-5 py-2 text-[13px] font-semibold transition', following ? 'bg-white/[0.08] text-foreground' : 'text-black')}
                  style={!following ? { background: TV_ACCENT } : undefined}
                >
                  {following ? 'متابَع' : 'متابعة'}
                </button>
              )}
            </div>

            {/* Description */}
            {(v.description || (v.hashtags && v.hashtags.length > 0)) && (
              <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className={cn('whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80', !descOpen && 'line-clamp-3')}>
                  {v.description}
                </p>
                {v.hashtags && v.hashtags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.hashtags.map((h) => (
                      <span key={h} className="text-[12px]" style={{ color: TV_ACCENT }}>#{h}</span>
                    ))}
                  </div>
                )}
                {(v.description?.length || 0) > 140 && (
                  <button onClick={() => setDescOpen((d) => !d)} className="mt-2 text-[12px] text-foreground/50">
                    {descOpen ? 'عرض أقل' : 'المزيد'}
                  </button>
                )}
              </div>
            )}

            {/* Comments */}
            <section className="mt-6">
              <h2 className="mb-3 text-[15px] font-semibold">{formatCount(comments?.length || 0)} تعليق</h2>
              {v.allow_comments === false ? (
                <p className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-[13px] text-foreground/50">التعليقات معطّلة على هذا الفيديو.</p>
              ) : (
                <>
                  {userId && (
                    <div className="mb-4 flex items-center gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                        placeholder="أضف تعليقاً..."
                        className="min-h-[44px] flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 text-[13px] outline-none placeholder:text-foreground/40"
                      />
                      <button onClick={submitComment} className="grid h-11 w-11 place-items-center rounded-full text-black" style={{ background: TV_ACCENT }} aria-label="إرسال">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="space-y-4">
                    {(comments || []).map((c: any) => (
                      <div key={c.id} className="flex gap-3">
                        {c.author?.avatar_url ? (
                          <img src={c.author.avatar_url} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-xs">{(c.author?.username || '?').charAt(0)}</span>
                        )}
                        <div className="min-w-0">
                          <p className="text-[12px] text-foreground/60">
                            @{c.author?.username || 'user'} · {timeAgo(c.created_at)} {c.is_pinned && <span style={{ color: TV_ACCENT }}>· مثبّت</span>}
                          </p>
                          <p className="whitespace-pre-wrap text-[13px] text-foreground/90">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    {(comments || []).length === 0 && <p className="text-[13px] text-foreground/40">لا توجد تعليقات بعد</p>}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Recommended */}
          <aside className={cn('w-full shrink-0', theater ? '' : 'xl:w-[380px]')}>
            <h2 className="mb-3 text-[15px] font-semibold">مقترح لك</h2>
            <div className={cn('grid gap-4', theater ? 'sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1')}>
              {!recommended
                ? Array.from({ length: 5 }).map((_, i) => <VideoCardSkeleton key={i} compact />)
                : recommended.map((r) => <VideoCard key={r.id} video={r} compact />)}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Watch;
