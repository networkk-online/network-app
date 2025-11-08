
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Plus, Volume2, VolumeX } from 'lucide-react';
import Header from '@/components/Header';
import { useReels } from '@/hooks/useReels';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CommentSection } from '@/components/CommentSection';

const Shorts = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  
  const { reels, loading, likedReels, toggleLike, incrementViews } = useReels(currentUserId);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    getCurrentUser();
  }, []);

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20">
          <div className="relative h-[calc(100vh-5rem)] flex justify-center items-center">
            <Skeleton className="w-full max-w-md h-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20">
          <div className="relative h-[calc(100vh-5rem)] flex justify-center items-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">لا توجد ريلز متاحة</p>
              <Button 
                onClick={() => navigate('/create-reel')}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-5 h-5 mr-2" />
                إنشاء أول ريل
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20">
        <div className="relative h-[calc(100vh-5rem)] flex justify-center">
          {/* Video Container */}
          <div className="relative w-full max-w-md bg-gray-900 rounded-lg overflow-hidden">
            {/* Video Player */}
            <video
              ref={videoRef}
              src={currentReel.video_url}
              className="w-full h-full object-cover"
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

            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-3 space-x-reverse mb-3">
                <img 
                  src={currentReel.profiles?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'} 
                  alt={currentReel.profiles?.username || 'User'}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {currentReel.profiles?.username || 'مستخدم'}
                  </p>
                  <p className="text-xs text-gray-300">
                    {formatDuration(currentReel.duration)}
                  </p>
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold px-6">
                  متابعة
                </Button>
              </div>
              {currentReel.caption && (
                <p className="text-white text-sm mb-4">{currentReel.caption}</p>
              )}
            </div>

            {/* Mute/Unmute Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            {/* Navigation Arrows */}
            {currentVideoIndex > 0 && (
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousVideo}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
                >
                  ↑
                </Button>
              </div>
            )}
            {currentVideoIndex < reels.length - 1 && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextVideo}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
                >
                  ↓
                </Button>
              </div>
            )}
          </div>

          {/* Side Actions */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => toggleLike(currentReel.id)}
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <Heart 
                className={`w-6 h-6 ${
                  likedReels.includes(currentReel.id) 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-white'
                }`} 
              />
              <span className="text-xs text-white">{currentReel.likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-xs text-white">{currentReel.comments_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-xs text-white">{currentReel.shares_count}</span>
            </Button>
          </div>

          {/* Create Reel Button */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button 
              onClick={() => navigate('/create-reel')}
              className="bg-primary hover:bg-primary/90 font-semibold px-6 py-3 rounded-full shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              إنشاء ريل
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl h-[600px] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>التعليقات</DialogTitle>
          </DialogHeader>
          <CommentSection type="reel" itemId={currentReel.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shorts;
