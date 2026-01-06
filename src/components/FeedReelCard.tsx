import { useNavigate } from 'react-router-dom';
import { Play, Heart, MessageCircle } from 'lucide-react';

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

  const handleClick = () => {
    navigate(`/shorts?reelId=${id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="relative w-32 h-48 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group"
    >
      {/* Thumbnail or Video */}
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={caption || 'Reel'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <video 
          src={videoUrl} 
          className="w-full h-full object-cover"
          muted
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Play Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>
      
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
