
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Volume2, VolumeX, MoreVertical, Bookmark, X, Camera, Send } from 'lucide-react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { reels, loading, likedReels, toggleLike, incrementViews } = useReels(currentUserId);
  
  // Insert live streams every 5-7 reels
  const feedItems = useMemo(() => {
    const items: Array<{ type: 'reel' | 'live'; data: any }> = [];
    let liveIndex = 0;
    
    reels.forEach((reel, index) => {
      items.push({ type: 'reel', data: reel });
      
      // Insert a live stream every 5-7 reels
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

  useEffect(() => {
    // Auto-play video when it changes
    if (videoRef.current) {
      videoRef.current.play();
      // Increment views when video starts playing
      if (reels[currentVideoIndex]) {
        incrementViews(reels[currentVideoIndex].id);
      }
    }
  }, [currentVideoIndex, reels]);


  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % feedItems.length);
  };

  const previousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + feedItems.length) % feedItems.length);
  };

  // Handle touch gestures for smooth swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchStartY(e.targetTouches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    const currentY = e.targetTouches[0].clientY;
    const diff = currentY - touchStartY;
    
    // Limit dragging at edges
    if ((currentVideoIndex === 0 && diff > 0) || 
        (currentVideoIndex === feedItems.length - 1 && diff < 0)) {
      setTranslateY(diff * 0.3); // Resistance at edges
    } else {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isTransitioning) return;
    setIsDragging(false);
    
    const threshold = window.innerHeight * 0.15; // 15% of screen height
    
    if (translateY < -threshold && currentVideoIndex < feedItems.length - 1) {
      // Swipe up - next video
      setIsTransitioning(true);
      setTranslateY(-window.innerHeight);
      setTimeout(() => {
        setCurrentVideoIndex(prev => prev + 1);
        setTranslateY(0);
        setIsTransitioning(false);
      }, 300);
    } else if (translateY > threshold && currentVideoIndex > 0) {
      // Swipe down - previous video
      setIsTransitioning(true);
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        setCurrentVideoIndex(prev => prev - 1);
        setTranslateY(0);
        setIsTransitioning(false);
      }, 300);
    } else {
      // Snap back
      setTranslateY(0);
    }
    
    setTouchStartY(0);
  };

  // Handle entering live stream
  const handleEnterLive = (streamId: string) => {
    navigate(`/broadcast?liveId=${streamId}`);
  };

  // Handle Save Reel
  const handleSave = async () => {
    if (!currentUserId) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك لحفظ الريلز",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    const result = await toggleSave();
    if (result?.success) {
      toast({
        title: result.action === 'saved' ? "تم الحفظ" : "تم إلغاء الحفظ",
        description: result.action === 'saved' ? "تم حفظ الريل بنجاح" : "تم إلغاء حفظ الريل",
      });
    } else if (result?.error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الريل",
        variant: "destructive"
      });
    }
  };

  // Get share URL for current reel
  const getShareUrl = () => {
    if (!currentReel) return '';
    return `${window.location.origin}/shorts?reelId=${currentReel.id}`;
  };

  const getShareText = () => {
    return currentReel?.caption || 'شاهد هذا الريل الرائع!';
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!currentUserId) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك للمراسلة",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!currentReel || currentUserId === currentReel.user_id) {
      toast({
        title: "لا يمكن مراسلة نفسك",
        description: "لا يمكنك إرسال رسالة لنفسك",
        variant: "destructive"
      });
      return;
    }

    setSendingMessage(true);
    try {
      // Check for existing conversation or create new one
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      let conversationId = null;

      if (existingParticipations) {
        for (const part of existingParticipations) {
          const { data: otherPart } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', part.conversation_id)
            .eq('user_id', currentReel.user_id)
            .maybeSingle();

          if (otherPart) {
            conversationId = part.conversation_id;
            break;
          }
        }
      }

      if (!conversationId) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        // Add participants
        await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: newConv.id, user_id: currentUserId },
            { conversation_id: newConv.id, user_id: currentReel.user_id }
          ]);

        conversationId = newConv.id;
      }

      navigate('/messages');
      toast({
        title: "تم فتح المحادثة",
        description: "يمكنك الآن المراسلة",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح المحادثة",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-white z-50"
        >
          <X className="w-6 h-6" />
        </Button>
        <div className="text-center">
          <p className="text-white text-lg mb-6">لا توجد ريلز متاحة</p>
          <Button 
            onClick={() => navigate('/create-reel')}
            className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-6"
          >
            <Camera className="w-5 h-5 mr-2" />
            إنشاء ريل
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white"
          >
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-white font-semibold text-lg">ريلز</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/create-reel')}
            className="text-white"
          >
            <Camera className="w-6 h-6" />
          </Button>
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
          {/* Live Stream or Video Player */}
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
                  <Avatar className="w-12 h-12 border-2 border-white">
                    <AvatarImage src={currentReel.profiles?.avatar_url} />
                    <AvatarFallback className="bg-primary text-white">
                      {currentReel.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg drop-shadow-lg">
                      {currentReel.profiles?.username || 'مستخدم'}
                    </p>
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
              </div>

              {/* Side Actions - Right Side */}
              <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-6">
                {/* Like Button */}
                <button
                  onClick={() => toggleLike(currentReel.id)}
                  className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <div className="relative">
                    <Heart 
                      className={`w-7 h-7 drop-shadow-lg transition-all ${
                        likedReels.includes(currentReel.id) 
                          ? 'fill-red-500 text-red-500 scale-110' 
                          : 'text-white'
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
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

                {/* Send/Share Button */}
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
                      isSaved 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-white'
                    } ${saveLoading ? 'opacity-50' : ''}`} 
                    strokeWidth={2.5} 
                  />
                  <span className="text-xs text-white font-semibold drop-shadow-lg">
                    {isSaved ? 'محفوظ' : 'حفظ'}
                  </span>
                </button>

                {/* More Options Button */}
                <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
                  <MoreVertical className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
                </button>

                {/* Profile Picture (animated rotating) */}
                <div className="relative mt-2">
                  <div className="w-10 h-10 rounded-full border-2 border-white p-0.5 animate-spin-slow">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={currentReel.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {currentReel.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>

              {/* Volume Control */}
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
    </div>
  );
};

export default Shorts;
