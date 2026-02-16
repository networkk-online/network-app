
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Volume2, VolumeX, MoreVertical, Bookmark, X, Camera, Send, Music, Settings } from 'lucide-react';
import { useReels } from '@/hooks/useReels';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentSection } from '@/components/CommentSection';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSavedReels } from '@/hooks/useSavedReels';
import { useToast } from '@/hooks/use-toast';
import ShareMenu from '@/components/ShareMenu';
import { LiveReelCard } from '@/components/LiveReelCard';
import { PostOptionsDrawer } from '@/components/PostOptionsDrawer';

// Mock live streams data
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
    recentComments: [
      { username: 'أمير', message: 'صوتك حلو!' },
    ],
  },
];

const Shorts = () => {
  const [searchParams] = useSearchParams();
  const initialReelId = searchParams.get('reelId');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [initialIndexSet, setInitialIndexSet] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [touchStartY, setTouchStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressAnimRef = useRef<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { reels, loading, likedReels, toggleLike, incrementViews } = useReels(currentUserId);
  
  // Insert live streams every 5-7 reels
  const feedItems = useMemo(() => {
    const items: Array<{ type: 'reel' | 'live'; data: any }> = [];
    let liveIndex = 0;
    
    reels.forEach((reel, index) => {
      items.push({ type: 'reel', data: reel });
      
      if ((index + 1) % 6 === 0 && liveIndex < MOCK_LIVE_STREAMS.length) {
        const liveStream = MOCK_LIVE_STREAMS[liveIndex];
        if (liveStream.isActive) {
          items.push({ type: 'live', data: liveStream });
          liveIndex++;
        }
      }
    });
    
    return items;
  }, [reels]);

  const currentItem = feedItems[currentVideoIndex];
  const currentReel = currentItem?.type === 'reel' ? currentItem.data : null;
  const currentLive = currentItem?.type === 'live' ? currentItem.data : null;
  
  const { isSaved, loading: saveLoading, toggleSave } = useSavedReels(currentReel?.id);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

  // Set initial index based on reelId from URL
  useEffect(() => {
    if (!initialIndexSet && reels.length > 0 && initialReelId) {
      const index = reels.findIndex(r => r.id === initialReelId);
      if (index !== -1) {
        setCurrentVideoIndex(index);
      }
      setInitialIndexSet(true);
    } else if (!initialIndexSet && reels.length > 0) {
      setInitialIndexSet(true);
    }
  }, [reels, initialReelId, initialIndexSet]);

  // Precise progress bar using requestAnimationFrame
  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
      progressAnimRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      progressAnimRef.current = requestAnimationFrame(updateProgress);
    };
    const onPause = () => {
      cancelAnimationFrame(progressAnimRef.current);
    };
    const onLoadedMetadata = () => {
      setVideoDuration(video.duration);
      setProgress(0);
    };
    const onSeeked = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);

    return () => {
      cancelAnimationFrame(progressAnimRef.current);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [currentVideoIndex, updateProgress]);

  useEffect(() => {
    if (videoRef.current) {
      setProgress(0);
      videoRef.current.play();
      if (reels[currentVideoIndex]) {
        incrementViews(reels[currentVideoIndex].id);
      }
    }
  }, [currentVideoIndex, reels]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchStartY(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStartY;
    
    if ((currentVideoIndex === 0 && diff > 0) || 
        (currentVideoIndex === feedItems.length - 1 && diff < 0)) {
      setTranslateY(diff * 0.3);
    } else {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isTransitioning) return;
    setIsDragging(false);
    
    const threshold = window.innerHeight * 0.15;
    
    if (translateY < -threshold && currentVideoIndex < feedItems.length - 1) {
      setIsTransitioning(true);
      setTranslateY(-window.innerHeight);
      setTimeout(() => {
        setCurrentVideoIndex(prev => prev + 1);
        setTranslateY(0);
        setIsTransitioning(false);
      }, 300);
    } else if (translateY > threshold && currentVideoIndex > 0) {
      setIsTransitioning(true);
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        setCurrentVideoIndex(prev => prev - 1);
        setTranslateY(0);
        setIsTransitioning(false);
      }, 300);
    } else {
      setTranslateY(0);
    }
    
    setTouchStartY(0);
  };

  const handleEnterLive = (streamId: string) => {
    navigate(`/broadcast?liveId=${streamId}`);
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast({ title: "يجب تسجيل الدخول", description: "سجل دخولك لحفظ الريلز", variant: "destructive" });
      navigate('/login');
      return;
    }
    const result = await toggleSave();
    if (result?.success) {
      toast({
        title: result.action === 'saved' ? "تم الحفظ" : "تم إلغاء الحفظ",
        description: result.action === 'saved' ? "تم حفظ الريل بنجاح" : "تم إلغاء حفظ الريل",
      });
    }
  };

  const getShareUrl = () => {
    if (!currentReel) return '';
    return `${window.location.origin}/shorts?reelId=${currentReel.id}`;
  };

  const getShareText = () => {
    return currentReel?.caption || 'شاهد هذا الريل الرائع!';
  };

  const handleProfileClick = () => {
    if (currentReel?.user_id) {
      navigate(`/profile/${currentReel.user_id}`);
    }
  };

  // Handle progress bar click/seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    video.currentTime = percent * video.duration;
    setProgress(percent * 100);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex justify-center items-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!feedItems || feedItems.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col justify-center items-center">
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
    <div className="h-screen bg-black overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
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

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center bg-black"
          style={{
            transform: `translateY(${translateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {currentItem?.type === 'live' && currentLive ? (
            <LiveReelCard
              stream={currentLive}
              onEnterLive={handleEnterLive}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          ) : currentReel ? (
            <>
              {/* Video Player */}
              <video
                ref={videoRef}
                src={currentReel.video_url}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted={isMuted}
                onClick={() => {
                  if (videoRef.current?.paused) {
                    videoRef.current?.play();
                  } else {
                    videoRef.current?.pause();
                  }
                }}
              />

              {/* User Info Overlay - Bottom Left */}
              <div className="absolute bottom-20 left-4 right-20 z-30">
                <div className="flex items-end gap-3 mb-3">
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
                  <Button 
                    size="sm" 
                    className="bg-white text-black hover:bg-gray-200 font-bold rounded-lg px-6 h-8"
                  >
                    متابعة
                  </Button>
                </div>
                {currentReel.caption && (
                  <p className="text-white text-sm leading-relaxed drop-shadow-lg line-clamp-2">
                    {currentReel.caption}
                  </p>
                )}

                {/* Audio Sync Indicator */}
                <div className="flex items-center gap-2 mt-3">
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

              {/* Side Actions - Right Side */}
              <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-6">
                {/* Like Button */}
                <button
                  onClick={() => toggleLike(currentReel.id)}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <Heart 
                    className={`w-7 h-7 drop-shadow-lg transition-all ${
                      likedReels.includes(currentReel.id) 
                        ? 'fill-red-500 text-red-500 scale-110' 
                        : 'text-white'
                    }`}
                    strokeWidth={2.5}
                  />
                  <span className="text-xs text-white font-semibold drop-shadow-lg">
                    {currentReel.likes_count || 0}
                  </span>
                </button>

                {/* Comment Button */}
                <button
                  onClick={() => setShowComments(true)}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                  <span className="text-xs text-white font-semibold drop-shadow-lg">
                    {currentReel.comments_count || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button 
                  onClick={() => setShowShareMenu(true)}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <Send className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                  <span className="text-xs text-white font-semibold drop-shadow-lg">مشاركة</span>
                </button>

                {/* Save/Bookmark Button */}
                <button 
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <Bookmark 
                    className={`w-7 h-7 drop-shadow-lg transition-all ${
                      isSaved ? 'fill-yellow-400 text-yellow-400' : 'text-white'
                    } ${saveLoading ? 'opacity-50' : ''}`} 
                    strokeWidth={2.5} 
                  />
                  <span className="text-xs text-white font-semibold drop-shadow-lg">
                    {isSaved ? 'محفوظ' : 'حفظ'}
                  </span>
                </button>

                {/* More Options Button */}
                <button 
                  onClick={() => setShowOptionsDrawer(true)}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <MoreVertical className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                </button>

                {/* Profile Picture (animated spinning disc) */}
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

              {/* Mute/Unmute */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-24 left-3 z-30 p-2 bg-black/50 rounded-full active:scale-95 transition-transform"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Precise Progress Bar - synced via rAF */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-40 cursor-pointer"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-white"
                  style={{ 
                    width: `${progress}%`,
                    transition: 'none'
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">التعليقات</DialogTitle>
          </DialogHeader>
          {currentReel && <CommentSection type="reel" itemId={currentReel.id} />}
        </DialogContent>
      </Dialog>

      {/* Share Menu */}
      <ShareMenu
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        shareUrl={getShareUrl()}
        shareTitle={currentReel?.caption || 'شاهد هذا الريل'}
        shareText={getShareText()}
      />

      {/* Options Drawer */}
      {currentReel && (
        <PostOptionsDrawer
          isOpen={showOptionsDrawer}
          onClose={() => setShowOptionsDrawer(false)}
          postId={currentReel.id}
          userId={currentReel.user_id}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default Shorts;
