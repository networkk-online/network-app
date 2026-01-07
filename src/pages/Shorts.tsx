
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Plus, Volume2, VolumeX, MoreVertical, Bookmark, X, Camera } from 'lucide-react';
import { useReels } from '@/hooks/useReels';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentSection } from '@/components/CommentSection';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Shorts = () => {
  const [searchParams] = useSearchParams();
  const initialReelId = searchParams.get('reelId');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [initialIndexSet, setInitialIndexSet] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { reels, loading, likedReels, toggleLike, incrementViews } = useReels(currentUserId);

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

  const currentReel = reels[currentVideoIndex];

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % reels.length);
  };

  const previousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + reels.length) % reels.length);
  };

  // Handle touch gestures for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;
    
    if (isSwipeUp && currentVideoIndex < reels.length - 1) {
      nextVideo();
    }
    if (isSwipeDown && currentVideoIndex > 0) {
      previousVideo();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
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

  if (!reels || reels.length === 0) {
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
        className="relative w-full h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full h-full snap-start flex items-center justify-center bg-black">
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

            {/* Share Button */}
            <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Share2 className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
              <span className="text-xs text-white font-semibold drop-shadow-lg">
                {currentReel.shares_count || 0}
              </span>
            </button>

            {/* Save/Bookmark Button */}
            <button className="flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <Bookmark className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
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
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">التعليقات</DialogTitle>
          </DialogHeader>
          <CommentSection type="reel" itemId={currentReel.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shorts;
