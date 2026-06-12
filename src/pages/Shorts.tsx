
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Volume2, VolumeX, MoreVertical, Bookmark, X, Camera, Send, Music, Settings } from 'lucide-react';
import { useReels } from '@/hooks/useReels';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommentSection } from '@/components/CommentSection';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSavedReels } from '@/hooks/useSavedReels';
import { useToast } from '@/hooks/use-toast';
import ShareMenu from '@/components/ShareMenu';
import SeoHead from '@/components/seo/SeoHead';
import { LiveReelCard } from '@/components/LiveReelCard';
import { PostOptionsDrawer } from '@/components/PostOptionsDrawer';
import ProfileOverlayContent from '@/components/ProfileOverlayContent';

const MOCK_LIVE_STREAMS = [
  {
    id: 'live-1',
    streamerId: 'user-1',
    streamerName: 'أحمد محمد',
    streamerAvatar: '/default-avatar.jpg',
    viewerCount: 1234,
    title: 'بث مباشر - نلعب ألعاب',
    isActive: true,
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    topGifters: [
      { name: 'سارة', avatar: '/default-avatar.jpg' },
      { name: 'علي', avatar: '/default-avatar.jpg' },
    ],
    recentComments: [
      { username: 'محمد', message: 'يا رائع! 🔥' },
      { username: 'فاطمة', message: 'استمر!' },
    ],
  },
  {
    id: 'live-2',
    streamerId: 'user-2',
    streamerName: 'ليلى العراقية',
    streamerAvatar: '/default-avatar.jpg',
    viewerCount: 856,
    title: 'أغاني عراقية حية',
    isActive: true,
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    topGifters: [],
    recentComments: [{ username: 'أمير', message: 'صوتك حلو!' }],
  },
];

interface ReelItemProps {
  reel: any;
  isActive: boolean;
  isMuted: boolean;
  onVisible: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
}

const ReelVideoItem = ({ reel, isActive, isMuted, onVisible, registerRef }: ReelItemProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    registerRef(el);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.intersectionRatio >= 0.7) onVisible();
        });
      },
      { threshold: [0, 0.5, 0.7, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible, registerRef]);

  // Play/pause video based on active state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [isActive]);

  // Background music for current reel only
  useEffect(() => {
    if (!isActive || !reel?.music_url) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = '';
      audioRef.current = null;
      return;
    }
    const a = new Audio();
    a.crossOrigin = 'anonymous';
    a.preload = 'auto';
    a.loop = true;
    a.muted = isMuted;
    a.volume = 0.85;
    a.src = reel.music_url;
    audioRef.current = a;
    a.play().catch(() => {});
    const onGesture = () => { if (a.paused) a.play().catch(() => {}); };
    window.addEventListener('pointerdown', onGesture, { once: true });
    return () => {
      a.pause();
      a.src = '';
      window.removeEventListener('pointerdown', onGesture);
    };
  }, [isActive, reel?.music_url, reel?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div
      ref={sectionRef}
      data-reel-id={reel.id}
      className="snap-start snap-always h-[100dvh] w-full flex-shrink-0 relative bg-black flex items-center justify-center"
      style={{ scrollSnapStop: 'always' }}
    >
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url || undefined}
        className="w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        preload="metadata"
        onClick={() => {
          const v = videoRef.current;
          if (!v) return;
          if (v.paused) v.play(); else v.pause();
        }}
      />
    </div>
  );
};

const Shorts = () => {
  const [searchParams] = useSearchParams();
  const initialReelId = searchParams.get('reelId');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const navigate = useNavigate();
  const { toast } = useToast();

  const { reels, loading, likedReels, toggleLike, incrementViews } = useReels(currentUserId);

  const feedItems = useMemo(() => {
    const items: Array<{ type: 'reel' | 'live'; data: any }> = [];
    let liveIndex = 0;
    reels.forEach((reel, index) => {
      items.push({ type: 'reel', data: reel });
      if ((index + 1) % 6 === 0 && liveIndex < MOCK_LIVE_STREAMS.length) {
        const live = MOCK_LIVE_STREAMS[liveIndex];
        if (live.isActive) {
          items.push({ type: 'live', data: live });
          liveIndex++;
        }
      }
    });
    return items;
  }, [reels]);

  const currentItem = feedItems[activeIndex];
  const currentReel = currentItem?.type === 'reel' ? currentItem.data : null;
  const currentLive = currentItem?.type === 'live' ? currentItem.data : null;

  const { isSaved, loading: saveLoading, toggleSave } = useSavedReels(currentReel?.id);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    })();
  }, []);

  // Scroll to initial reel
  useEffect(() => {
    if (!initialReelId || feedItems.length === 0) return;
    const idx = feedItems.findIndex(it => it.type === 'reel' && it.data.id === initialReelId);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        const el = itemRefs.current.get(idx);
        el?.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveIndex(idx);
      });
    }
  }, [initialReelId, feedItems]);

  // Increment view when reel becomes active
  useEffect(() => {
    if (currentReel) incrementViews(currentReel.id);
  }, [currentReel?.id]);

  const handleItemVisible = useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? prev : index));
  }, []);

  const registerItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(index, el);
    else itemRefs.current.delete(index);
  }, []);

  const handleEnterLive = (streamId: string) => navigate(`/broadcast?liveId=${streamId}`);

  const handleSave = async () => {
    if (!currentUserId) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجل دخولك لحفظ الريلز', variant: 'destructive' });
      navigate('/login');
      return;
    }
    const result = await toggleSave();
    if (result?.success) {
      toast({
        title: result.action === 'saved' ? 'تم الحفظ' : 'تم إلغاء الحفظ',
        description: result.action === 'saved' ? 'تم حفظ الريل بنجاح' : 'تم إلغاء حفظ الريل',
      });
    }
  };

  const getShareUrl = () => currentReel ? `${window.location.origin}/shorts?reelId=${currentReel.id}` : '';
  const handleProfileClick = () => { if (currentReel?.user_id) setShowProfileOverlay(true); };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-black flex justify-center items-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col justify-center items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="absolute top-4 left-4 text-white z-50">
          <X className="w-6 h-6" />
        </Button>
        <div className="text-center">
          <p className="text-white text-lg mb-6">لا توجد ريلز متاحة</p>
          <Button onClick={() => navigate('/create-reel')} className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6">
            <Camera className="w-5 h-5 mr-2" />
            إنشاء ريل
          </Button>
        </div>
      </div>
    );
  }

  const musicTitle = currentReel?.music_title || currentReel?.caption?.slice(0, 30) || 'Original Audio';
  const musicArtist = currentReel?.music_artist || currentReel?.profiles?.username || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <SeoHead route="/shorts" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center justify-between p-4 pointer-events-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white">
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-white font-semibold text-lg">ريلز</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="text-white">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/create-reel')} className="text-white">
              <Camera className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Snap-scroll feed (Instagram-style) */}
      <div
        ref={scrollerRef}
        className="h-[100dvh] w-full overflow-y-scroll overscroll-y-contain scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {feedItems.map((item, index) => {
          if (item.type === 'live') {
            return (
              <div
                key={`live-${item.data.id}-${index}`}
                ref={(el) => registerItemRef(index, el)}
                data-index={index}
                className="snap-start snap-always h-[100dvh] w-full flex-shrink-0 relative bg-black"
                style={{ scrollSnapStop: 'always' }}
              >
                <LiveReelCard
                  stream={item.data}
                  onEnterLive={handleEnterLive}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                />
              </div>
            );
          }
          return (
            <ReelVideoItem
              key={item.data.id}
              reel={item.data}
              isActive={activeIndex === index}
              isMuted={isMuted}
              onVisible={() => handleItemVisible(index)}
              registerRef={(el) => registerItemRef(index, el)}
            />
          );
        })}
      </div>

      {/* Overlay UI (fixed; tied to current reel) */}
      {currentReel && (
        <>
          {/* User Info Overlay - Bottom Left */}
          <div className="absolute bottom-20 left-4 right-20 z-30 pointer-events-none">
            <div className="flex items-end gap-3 mb-3 pointer-events-auto">
              <button onClick={handleProfileClick} className="flex-shrink-0">
                <Avatar className="w-12 h-12 border-2 border-white">
                  <AvatarImage src={currentReel.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {currentReel.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1">
                <button onClick={handleProfileClick}>
                  <p className="font-bold text-white text-lg drop-shadow-lg text-right">
                    {currentReel.profiles?.username || 'مستخدم'}
                  </p>
                </button>
              </div>
              <Button size="sm" className="bg-white text-black hover:bg-gray-200 font-bold rounded-lg px-6 h-8">
                متابعة
              </Button>
            </div>
            {currentReel.caption && (
              <p className="text-white text-sm leading-relaxed drop-shadow-lg line-clamp-2">
                {currentReel.caption}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3 pointer-events-auto">
              <Music className="w-3.5 h-3.5 text-white flex-shrink-0" />
              <div className="overflow-hidden max-w-[200px]">
                <p className="text-white text-xs whitespace-nowrap animate-marquee">
                  {musicArtist} · {musicTitle}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full border-2 border-white/50 flex-shrink-0 overflow-hidden animate-spin-slow">
                <Avatar className="w-full h-full">
                  <AvatarImage src={currentReel.profiles?.avatar_url} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">♫</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Side Actions - Right */}
          <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-6">
            <button onClick={() => toggleLike(currentReel.id)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Heart className={`w-7 h-7 drop-shadow-lg transition-all ${likedReels.includes(currentReel.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} strokeWidth={2.5} />
              <span className="text-xs text-white font-semibold drop-shadow-lg">{currentReel.likes_count || 0}</span>
            </button>
            <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
              <span className="text-xs text-white font-semibold drop-shadow-lg">{currentReel.comments_count || 0}</span>
            </button>
            <button onClick={() => setShowShareMenu(true)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Send className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
              <span className="text-xs text-white font-semibold drop-shadow-lg">مشاركة</span>
            </button>
            <button onClick={handleSave} disabled={saveLoading} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Bookmark className={`w-7 h-7 drop-shadow-lg transition-all ${isSaved ? 'fill-yellow-400 text-yellow-400' : 'text-white'} ${saveLoading ? 'opacity-50' : ''}`} strokeWidth={2.5} />
              <span className="text-xs text-white font-semibold drop-shadow-lg">{isSaved ? 'محفوظ' : 'حفظ'}</span>
            </button>
            <button onClick={() => setShowOptionsDrawer(true)} className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <MoreVertical className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
            </button>
            <button className="relative mt-2" onClick={handleProfileClick}>
              <div className="w-10 h-10 rounded-full border-2 border-white p-0.5 animate-spin-slow">
                <Avatar className="w-full h-full">
                  <AvatarImage src={currentReel.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {currentReel.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </button>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-24 left-3 z-30 p-2 bg-black/50 rounded-full active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        </>
      )}

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">التعليقات</DialogTitle>
          </DialogHeader>
          {currentReel && <CommentSection type="reel" itemId={currentReel.id} />}
        </DialogContent>
      </Dialog>

      <ShareMenu
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        shareUrl={getShareUrl()}
        shareTitle={currentReel?.caption || 'شاهد هذا الريل'}
        shareText={currentReel?.caption || 'شاهد هذا الريل الرائع!'}
      />

      {currentReel && (
        <PostOptionsDrawer
          isOpen={showOptionsDrawer}
          onClose={() => setShowOptionsDrawer(false)}
          postId={currentReel.id}
          userId={currentReel.user_id}
          currentUserId={currentUserId}
        />
      )}

      <Sheet open={showProfileOverlay} onOpenChange={setShowProfileOverlay}>
        <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>الملف الشخصي</SheetTitle>
          </SheetHeader>
          {currentReel?.user_id && showProfileOverlay && (
            <ProfileOverlayContent profileId={currentReel.user_id} currentUserId={currentUserId} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Shorts;
