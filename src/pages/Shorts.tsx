
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Plus, Play, Pause } from 'lucide-react';
import Header from '@/components/Header';

interface ShortVideo {
  id: string;
  username: string;
  userAvatar: string;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  duration: string;
}

const Shorts = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);

  // Mock data for short videos
  const shortVideos: ShortVideo[] = [
    {
      id: '1',
      username: 'creative_artist',
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      videoUrl: 'https://example.com/video1.mp4',
      caption: 'مقطع إبداعي قصير! #فن #إبداع',
      likes: 2543,
      comments: 87,
      shares: 156,
      duration: '0:15'
    },
    {
      id: '2',
      username: 'comedy_king',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      videoUrl: 'https://example.com/video2.mp4',
      caption: 'كوميديا مضحكة 😂 #مضحك #ترفيه',
      likes: 4821,
      comments: 203,
      shares: 342,
      duration: '0:12'
    },
    {
      id: '3',
      username: 'dance_master',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      videoUrl: 'https://example.com/video3.mp4',
      caption: 'رقصة جديدة وحماسية! 💃 #رقص #حماس',
      likes: 3267,
      comments: 142,
      shares: 298,
      duration: '0:20'
    }
  ];

  const currentVideo = shortVideos[currentVideoIndex];

  const handleLike = (videoId: string) => {
    setLikedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % shortVideos.length);
  };

  const previousVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + shortVideos.length) % shortVideos.length);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20">
        <div className="relative h-[calc(100vh-5rem)] flex justify-center">
          {/* Video Container */}
          <div className="relative w-full max-w-md bg-gray-900 rounded-lg overflow-hidden">
            {/* Video Placeholder */}
            <div className="relative h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {isPlaying ? (
                    <Play className="w-16 h-16 text-black" />
                  ) : (
                    <Pause className="w-16 h-16 text-black" />
                  )}
                </div>
                <p className="text-gray-400 mb-2">مقطع فيديو قصير</p>
                <p className="text-green-400 font-semibold">{currentVideo.duration}</p>
              </div>
              
              {/* Play/Pause Button */}
              <Button
                variant="ghost"
                size="lg"
                className="absolute inset-0 bg-transparent hover:bg-black/20"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <span className="sr-only">تشغيل/إيقاف</span>
              </Button>
            </div>

            {/* User Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={currentVideo.userAvatar} 
                  alt={currentVideo.username}
                  className="w-10 h-10 rounded-full border-2 border-green-500"
                />
                <div>
                  <p className="font-semibold text-white">{currentVideo.username}</p>
                  <p className="text-xs text-gray-300">{currentVideo.duration}</p>
                </div>
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6">
                  متابعة
                </Button>
              </div>
              <p className="text-white text-sm mb-4">{currentVideo.caption}</p>
            </div>

            {/* Navigation Arrows */}
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
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
              <Button
                variant="ghost"
                size="sm"
                onClick={nextVideo}
                className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 p-0"
              >
                ↓
              </Button>
            </div>
          </div>

          {/* Side Actions */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleLike(currentVideo.id)}
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <Heart 
                className={`w-6 h-6 ${
                  likedVideos.includes(currentVideo.id) 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-white'
                }`} 
              />
              <span className="text-xs text-white">{currentVideo.likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-xs text-white">{currentVideo.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="flex flex-col items-center space-y-1 bg-black/50 hover:bg-black/70 rounded-full w-16 h-16 p-0"
            >
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-xs text-white">{currentVideo.shares}</span>
            </Button>
          </div>

          {/* Create Short Button */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full shadow-lg shadow-green-500/25">
              <Plus className="w-5 h-5 mr-2" />
              إنشاء مقطع
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shorts;
