import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Pause, Volume2, VolumeX, Maximize, Heart, MessageCircle, Share2, Gift, Eye, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatViews = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

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
  const [theaterMode, setTheaterMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: v } = await supabase.from('videos').select('*').eq('id', videoId!).single();
      if (v) {
        setVideo(v);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', v.user_id).single();
        setProfile(p);
        // Increment views
        supabase.from('videos').update({ views_count: (v.views_count || 0) + 1 }).eq('id', v.id).then(() => {});
      }

      // Suggested
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
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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

  return (
    <div className={`min-h-screen bg-background transition-all duration-700 ${theaterMode ? 'pt-0' : ''}`}>
      {/* Back button - fades out in theater */}
      <AnimatePresence>
        {!theaterMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b border-white/[0.06] safe-area-top"
          >
            <div className="flex items-center gap-3 px-4 h-12">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="glass-btn w-9 h-9 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white/70" strokeWidth={1.4} />
              </motion.button>
              <h1 className="text-foreground text-sm font-medium line-clamp-1 flex-1" dir="rtl">{video.title}</h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player */}
      <div className={`relative ${theaterMode ? 'h-screen' : 'aspect-video'} bg-black w-full max-w-5xl mx-auto`}>
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail_url}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onTouchStart={showControlsBriefly}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          muted={isMuted}
          playsInline
        />

        {/* Glass Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col justify-end"
            >
              {/* Theater mode exit */}
              {theaterMode && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTheaterMode(false)}
                  className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5 text-white/80" />
                </motion.button>
              )}

              {/* Center play/pause */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
                >
                  {isPlaying ? <Pause className="w-7 h-7 text-white fill-white" /> : <Play className="w-7 h-7 text-white fill-white ml-1" />}
                </motion.button>
              </div>

              {/* Bottom controls bar */}
              <div className="px-4 pb-4 space-y-2">
                {/* Seek bar */}
                <div className="h-1 rounded-full bg-white/10 cursor-pointer relative group" onClick={handleSeek}>
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }} />
                </div>

                <div className="floating-controls flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white/80 hover:text-white transition-colors">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <span className="text-white/50 text-xs font-medium">
                      {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                    </span>
                  </div>
                  <button onClick={() => setTheaterMode(!theaterMode)} className="text-white/80 hover:text-white transition-colors">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content below video */}
      {!theaterMode && (
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 px-4 pb-28 pt-4">
          {/* Main info */}
          <div className="flex-1 space-y-4">
            {/* Title & stats */}
            <div className="glass-card p-4 relative z-10" dir="rtl">
              <h2 className="text-foreground text-lg font-semibold leading-snug">{video.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground text-xs">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatViews(video.views_count || 0)} مشاهدة</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(video.duration || 0)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLiked(!liked)} className={`glass-btn px-4 py-2 flex items-center gap-1.5 text-xs ${liked ? 'text-red-400' : 'text-white/60'}`}>
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} strokeWidth={1.4} />
                  {video.likes_count || 0}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} className="glass-btn px-4 py-2 flex items-center gap-1.5 text-xs text-white/60">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.4} />
                  {video.comments_count || 0}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} className="glass-btn px-4 py-2 flex items-center gap-1.5 text-xs text-white/60">
                  <Share2 className="w-4 h-4" strokeWidth={1.4} />
                  مشاركة
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="glass-btn px-4 py-2 flex items-center gap-1.5 text-xs text-primary"
                  style={{ boxShadow: '0 0 16px hsla(144, 90%, 33%, 0.15), 0 0 4px hsla(144, 90%, 33%, 0.3)' }}
                >
                  <Gift className="w-4 h-4" strokeWidth={1.4} />
                  دعم المبدع
                </motion.button>
              </div>
            </div>

            {/* Creator */}
            <div className="glass-card p-4 flex items-center gap-3 relative z-10" dir="rtl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
              )}
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">{profile?.full_name || profile?.username || 'مبدع'}</p>
                <p className="text-muted-foreground text-xs">{profile?.followers_count || 0} متابع</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                متابعة
              </motion.button>
            </div>

            {/* Description */}
            {video.description && (
              <div className="glass-card p-4 relative z-10" dir="rtl">
                <p className={`text-white/60 text-sm leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>{video.description}</p>
                <button onClick={() => setDescExpanded(!descExpanded)} className="text-primary text-xs mt-2 flex items-center gap-1">
                  {descExpanded ? <><ChevronUp className="w-3 h-3" /> أقل</> : <><ChevronDown className="w-3 h-3" /> المزيد</>}
                </button>
              </div>
            )}

            {/* Comments placeholder */}
            <div className="glass-card p-4 relative z-10" dir="rtl">
              <h3 className="text-foreground text-sm font-medium mb-3">التعليقات</h3>
              <p className="text-muted-foreground text-xs">لا توجد تعليقات بعد</p>
            </div>
          </div>

          {/* Suggested sidebar */}
          <div className="lg:w-80 space-y-3">
            <h3 className="text-foreground text-sm font-medium px-1" dir="rtl">التالي</h3>
            {suggested.map(sv => {
              const sp = suggestedProfiles.get(sv.user_id);
              return (
                <motion.div
                  key={sv.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/watch/${sv.id}`)}
                  className="glass-card flex gap-3 p-2 cursor-pointer will-change-transform"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <div className="relative w-40 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                    {sv.thumbnail_url ? (
                      <img src={sv.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/10" />
                      </div>
                    )}
                    {sv.duration > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white/80">
                        {formatDuration(sv.duration)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1" dir="rtl">
                    <p className="text-foreground text-xs font-medium line-clamp-2 leading-snug">{sv.title}</p>
                    <p className="text-muted-foreground text-[10px] mt-1">{sp?.username || 'مستخدم'}</p>
                    <p className="text-muted-foreground text-[10px]">{formatViews(sv.views_count || 0)} مشاهدة</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
