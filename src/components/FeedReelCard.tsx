import { useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Play, Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';

interface FeedReelCardProps {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  username: string;
  userAvatar: string;
}

const FeedReelCard = ({
  id,
  videoUrl,
  thumbnailUrl,
  caption,
  likesCount,
  commentsCount,
  username,
  userAvatar,
}: FeedReelCardProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isVisible]);

  const handleClick = () => {
    navigate(`/shorts?reelId=${id}`);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      className="relative w-32 h-48 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group"
    >
      {/* Video */}
      <video 
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop
        playsInline
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Play Icon - shows when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Mute Toggle */}
      <button
        onClick={toggleMute}
        className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isMuted ? (
          <VolumeX className="w-3 h-3 text-white" />
        ) : (
          <Volume2 className="w-3 h-3 text-white" />
        )}
      </button>
      
      {/* User Info */}
      <div className="absolute top-2 left-2">
        <img 
          src={userAvatar || '/default-avatar.jpg'} 
          alt={username}
          className="w-6 h-6 rounded-full border border-white/50 object-cover"
        />
      </div>
      
      {/* Stats */}
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-white text-xs truncate mb-1">{caption || ''}</p>
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {commentsCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FeedReelCard;
