import { Camera } from 'lucide-react';

interface StoryCircleProps {
  username: string;
  avatar: string;
  hasStory?: boolean;
  isOwn?: boolean;
  hasViewed?: boolean;
  onClick: () => void;
  onCameraClick?: () => void;
}

const StoryCircle = ({ username, avatar, hasStory = false, isOwn = false, hasViewed = false, onClick, onCameraClick }: StoryCircleProps) => {
  const getRingClass = () => {
    if (!hasStory) return 'story-ring-none';
    if (hasViewed) return 'story-ring-viewed';
    return 'story-ring-active';
  };

  return (
    <div className="flex flex-col items-center space-y-1.5">
      <div className="relative cursor-pointer group" onClick={onClick}>
        <div className={`${getRingClass()} p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-92`}>
          <div className="bg-black p-[2px] rounded-full">
            <img 
              src={avatar}
              alt={username}
              className="w-[62px] h-[62px] rounded-full object-cover"
            />
          </div>
        </div>
        
        {isOwn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick?.();
            }}
            className="absolute -bottom-0.5 -right-0.5 bg-primary hover:bg-primary/80 rounded-full p-1.5 border-2 border-black transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ boxShadow: '0 0 10px hsla(144, 90%, 33%, 0.3)' }}
          >
            <Camera className="w-3 h-3 text-primary-foreground" />
          </button>
        )}
      </div>
      
      <span className="text-[11px] text-white/40 max-w-[68px] truncate font-medium tracking-wide">
        {isOwn ? 'قصتك' : username}
      </span>
    </div>
  );
};

export default StoryCircle;
