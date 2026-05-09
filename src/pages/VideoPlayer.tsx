import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Pause, Volume2, VolumeX, Maximize, Heart, Share2, Eye, Clock, ChevronDown, ChevronUp, Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const NEON = '#39FF14';

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatViews = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  return `قبل ${Math.floor(diff / 86400)} يوم`;
};

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimer = useRef<NodeJS.Timeout>();

  const [video, setVideo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [suggested, setSuggested] = useState<any[]>([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<any[]>([]);
  const [commentProfiles, setCommentProfiles] = useState<Map<string, any>>(new Map());
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: v } = await supabase.from('videos').select('*').eq('id', videoId!).single();
      if (v) {
        setVideo(v);
        setLikesCount(v.likes_count || 0);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', v.user_id).single();
        setProfile(p);
        supabase.from('videos').update({ views_count: (v.views_count || 0) + 1 }).eq('id', v.id).then(() => {});

        // Check subscription (follow)
        const { data: { user } } = await supabase.auth.getUser();
        if (user && p) {
          const { data: f } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', p.id).maybeSingle();
          setSubscribed(!!f);
        }
      }

      const { data: sg } = await supabase
        .from('videos')
        .select('*')
        .neq('id', videoId!)
        .eq('is_published', true)
        .order('views_count', { ascending: false })
        .limit(10);
      setSuggested(sg || []);
      if (sg && sg.length > 0) {
        const ids = [...new Set(sg.map(s => s.user_id))];
        const { data: profs } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids);
        if (profs) {
          const m = new Map<string, any>();
          profs.forEach(p => m.set(p.id, p));
          setSuggestedProfiles(m);
        }
      }

      // Load comments (try video_comments, fallback empty)
      const { data: cmts } = await supabase
        .from('video_comments' as any)
        .select('*')
        .eq('video_id', videoId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cmts && Array.isArray(cmts)) {
        setComments(cmts);
        const uids = [...new Set(cmts.map((c: any) => c.user_id))];
        if (uids.length) {
          const { data: cps } = await supabase.from('profiles').select('id, username, avatar_url, full_name').in('id', uids);
          if (cps) {
            const m = new Map<string, any>();
            cps.forEach(p => m.set(p.id, p));
            setCommentProfiles(m);
          }
        }
      }

      setLoading(false);
    };
    load();
  }, [videoId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
    showControlsBriefly();
  };

  const showControlsBriefly = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2800);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((ct / dur) * 100);
    setCurTime(ct);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * (videoRef.current.duration || 0);
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount(c => Math.max(0, c + (next ? 1 : -1)));
  };

  const handleSubscribe = async () => {
    if (!currentUserId || !profile?.id) {
      toast.error('يجب تسجيل الدخول');
      return;
    }
    if (currentUserId === profile.id) return;
    const wasSubbed = subscribed;
    const delta = wasSubbed ? -1 : 1;
    setSubscribed(!wasSubbed);
    setProfile((p: any) => p ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) + delta) } : p);
    try {
      if (wasSubbed) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profile.id });
        if (error) throw error;
      }
      // Re-sync from server (trigger updates the count)
      const { data: fresh } = await supabase.from('profiles').select('followers_count').eq('id', profile.id).single();
      if (fresh) setProfile((p: any) => p ? { ...p, followers_count: fresh.followers_count } : p);
    } catch {
      setSubscribed(wasSubbed);
      setProfile((p: any) => p ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) - delta) } : p);
      toast.error('حدث خطأ');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: video?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('تم نسخ الرابط'); }
    } catch {}
  };

  const submitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    setSubmittingComment(true);
    const text = newComment.trim();
    const optimistic = { id: `tmp-${Date.now()}`, user_id: currentUserId, video_id: videoId, content: text, created_at: new Date().toISOString() };
    setComments(prev => [optimistic, ...prev]);
    setNewComment('');
    const { data, error } = await supabase.from('video_comments' as any).insert({ video_id: videoId, user_id: currentUserId, content: text }).select('*').single();
    if (error) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id));
      toast.error('تعذر إضافة التعليق');
    } else if (data) {
      setComments(prev => [data, ...prev.filter(c => c.id !== optimistic.id)]);
      if (!commentProfiles.has(currentUserId)) {
        const { data: me } = await supabase.from('profiles').select('id, username, avatar_url, full_name').eq('id', currentUserId).single();
        if (me) setCommentProfiles(m => new Map(m).set(currentUserId, me));
      }
    }
    setSubmittingComment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: `${NEON}33`, borderTopColor: NEON }} />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">الفيديو غير موجود</p>
      </div>
    );
  }

  const isOwnChannel = currentUserId === profile?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center gap-3 px-4 h-12">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors">
            <ArrowRight className="w-5 h-5 text-foreground/70" strokeWidth={1.4} />
          </motion.button>
          <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color: NEON, textShadow: `0 0 10px ${NEON}88` }}>NETWORKK CINEMA</span>
          <h1 className="text-foreground text-sm font-medium line-clamp-1 flex-1" dir="rtl">{video.title}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 pb-28">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Video Player — 12px radius */}
            <div className="relative aspect-video bg-black w-full overflow-hidden"
              style={{ borderRadius: 12, boxShadow: `0 0 40px ${NEON}22, 0 12px 40px rgba(0,0,0,0.6)` }}>
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                onTouchStart={showControlsBriefly}
                onMouseMove={showControlsBriefly}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                playsInline
              />

              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 flex flex-col justify-end pointer-events-none"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={togglePlay}
                        className="pointer-events-auto w-16 h-16 rounded-full backdrop-blur-xl flex items-center justify-center"
                        style={{
                          background: 'rgba(0,0,0,0.45)',
                          border: `1px solid ${NEON}55`,
                          boxShadow: `0 0 22px ${NEON}55`,
                        }}
                      >
                        {isPlaying ? <Pause className="w-7 h-7" style={{ color: NEON }} fill={NEON} /> : <Play className="w-7 h-7 ml-1" style={{ color: NEON }} fill={NEON} />}
                      </motion.button>
                    </div>

                    <div className="px-3 sm:px-4 pb-3 space-y-2 pointer-events-auto">
                      {/* Neon Progress bar */}
                      <div className="h-1 rounded-full bg-white/10 cursor-pointer relative group" onClick={handleSeek}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: NEON, boxShadow: `0 0 10px ${NEON}, 0 0 4px ${NEON}` }} />
                        <div className="absolute top-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `${progress}%`, transform: `translate(-50%, -50%)`, background: NEON, boxShadow: `0 0 12px ${NEON}` }} />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl backdrop-blur-xl"
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3">
                          <button onClick={togglePlay} className="hover:opacity-80 transition" style={{ color: NEON }}>
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          <button onClick={() => setIsMuted(!isMuted)} className="hover:opacity-80 transition" style={{ color: NEON }}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <span className="text-foreground/60 text-xs font-medium tabular-nums">
                            {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                          </span>
                        </div>
                        <button onClick={() => videoRef.current?.requestFullscreen?.()} className="hover:opacity-80 transition" style={{ color: NEON }}>
                          <Maximize className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Title + meta */}
            <div dir="rtl">
              <h2 className="text-foreground text-lg sm:text-xl font-semibold leading-snug">{video.title}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-muted-foreground text-xs">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" style={{ color: NEON }} />{formatViews(video.views_count || 0)} مشاهدة</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(video.created_at)}</span>
              </div>
            </div>

            {/* Channel + Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
              dir="rtl"
            >
              {/* Channel */}
              <div className="flex items-center gap-3 min-w-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/[0.06]" />
                )}
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-semibold truncate">{profile?.full_name || profile?.username || 'مبدع'}</p>
                  <p className="text-muted-foreground text-[11px]">{formatViews(profile?.followers_count || 0)} مشترك</p>
                </div>
                {!isOwnChannel && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubscribe}
                    className="mr-2 px-5 py-2 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: subscribed ? 'rgba(255,255,255,0.08)' : NEON,
                      color: subscribed ? 'rgba(255,255,255,0.6)' : '#FFFFFF',
                      border: subscribed ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      boxShadow: subscribed ? 'none' : `0 0 18px ${NEON}88, 0 4px 14px ${NEON}44`,
                      opacity: subscribed ? 0.7 : 1,
                      textShadow: subscribed ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {subscribed ? 'مشترك ✓' : 'اشترك'}
                  </motion.button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleLike}
                  className="px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    background: liked ? `${NEON}22` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${liked ? `${NEON}66` : 'rgba(255,255,255,0.08)'}`,
                    color: liked ? NEON : 'rgba(255,255,255,0.85)',
                    boxShadow: liked ? `0 0 16px ${NEON}55` : 'none',
                  }}
                >
                  <Heart className="w-4 h-4" fill={liked ? NEON : 'transparent'} stroke={liked ? NEON : 'currentColor'} strokeWidth={1.6} />
                  <span className="tabular-nums">{formatViews(likesCount)}</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleShare}
                  className="px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                >
                  <Share2 className="w-4 h-4" style={{ color: NEON }} strokeWidth={1.6} />
                  مشاركة
                </motion.button>
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="p-4 rounded-2xl" dir="rtl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
                <p className={`text-foreground/75 text-sm leading-relaxed whitespace-pre-wrap ${descExpanded ? '' : 'line-clamp-3'}`}>{video.description}</p>
                <button onClick={() => setDescExpanded(!descExpanded)}
                  className="text-xs mt-2 flex items-center gap-1 font-medium" style={{ color: NEON }}>
                  {descExpanded ? <><ChevronUp className="w-3 h-3" /> أقل</> : <><ChevronDown className="w-3 h-3" /> المزيد</>}
                </button>
              </div>
            )}

            {/* Comments */}
            <div className="p-4 rounded-2xl space-y-4" dir="rtl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" style={{ color: NEON }} />
                <h3 className="text-foreground text-sm font-semibold">التعليقات ({comments.length})</h3>
              </div>

              {/* New comment input */}
              {currentUserId && (
                <div className="flex items-start gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    placeholder="أضف تعليقاً..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = `${NEON}55`}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={submitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                    style={{ background: NEON, boxShadow: `0 0 16px ${NEON}66` }}
                  >
                    <Send className="w-4 h-4 text-black" />
                  </motion.button>
                </div>
              )}

              {/* Comment list */}
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-6">لا توجد تعليقات بعد. كن أول من يعلّق ✨</p>
              ) : (
                <div className="space-y-2.5">
                  {comments.map(c => {
                    const cp = commentProfiles.get(c.user_id);
                    return (
                      <div key={c.id} className="flex gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
                        {cp?.avatar_url ? (
                          <img src={cp.avatar_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-foreground text-xs font-semibold truncate">{cp?.full_name || cp?.username || 'مستخدم'}</p>
                            <span className="text-muted-foreground text-[10px]">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-foreground/80 text-xs leading-relaxed mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Related sidebar */}
          <div className="lg:w-[360px] space-y-3">
            <h3 className="text-foreground text-sm font-semibold px-1 flex items-center gap-2" dir="rtl">
              <span className="w-1 h-4 rounded-full" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
              فيديوهات مقترحة
            </h3>
            {suggested.map(sv => {
              const sp = suggestedProfiles.get(sv.user_id);
              return (
                <motion.div
                  key={sv.id}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/watch/${sv.id}`)}
                  className="flex gap-3 p-2 cursor-pointer rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${NEON}44`; e.currentTarget.style.boxShadow = `0 0 20px ${NEON}22`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="relative w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-black">
                    {sv.thumbnail_url ? (
                      <img src={sv.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <video src={sv.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                    )}
                    {sv.duration > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white/90 tabular-nums">
                        {formatDuration(sv.duration)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1" dir="rtl">
                    <p className="text-foreground text-xs font-semibold line-clamp-2 leading-snug">{sv.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-1.5">{sp?.username || 'مستخدم'}</p>
                    <p className="text-muted-foreground text-[10px]">{formatViews(sv.views_count || 0)} مشاهدة • {timeAgo(sv.created_at)}</p>
                  </div>
                </motion.div>
              );
            })}
            {suggested.length === 0 && (
              <p className="text-muted-foreground text-xs text-center py-6">لا توجد مقترحات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
