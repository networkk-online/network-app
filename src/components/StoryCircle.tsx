import { Camera } from 'lucide-react';
import { useLiveStatusSingle } from '@/hooks/useLiveStatus';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface StoryCircleProps {
  username: string;
  avatar: string;
  hasStory?: boolean;
  isOwn?: boolean;
  hasViewed?: boolean;
  userId?: string;
  onClick: () => void;
  onCameraClick?: () => void;
}

const StoryCircle = ({ username, avatar, hasStory = false, isOwn = false, hasViewed = false, userId, onClick, onCameraClick }: StoryCircleProps) => {
  const navigate = useNavigate();
  const { isLive, roomId } = useLiveStatusSingle(userId);

  const getRingClass = () => {
    if (isLive) return '';
    if (!hasStory) return 'story-ring-none';
    if (hasViewed) return 'story-ring-viewed';
    return 'story-ring-active';
  };

  const handleClick = () => {
    if (isLive && roomId) {
      navigate(`/broadcast?join=${roomId}`);
      return;
    }
    onClick();
  };

  return (
    <div className="flex flex-col items-center space-y-1.5">
      <div className="relative cursor-pointer group" onClick={handleClick}>
        {isLive && (
          <>
            <motion.div
              aria-hidden
              className="absolute -inset-[3px] rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #39FF14, #08A045, #39FF14)',
                boxShadow: '0 0 14px rgba(57,255,20,0.55), 0 0 28px rgba(57,255,20,0.3)',
                willChange: 'transform',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              aria-hidden
              className="absolute -inset-[3px] rounded-full pointer-events-none"
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 0 2px rgba(57,255,20,0.55)' }}
            />
          </>
        )}
        <div className={`${getRingClass()} p-[2px] rounded-full transition-transform duration-300 group-hover:scale-105 group-active:scale-92 relative`}>
          <div className="bg-black p-[2px] rounded-full">
            <img
              src={avatar}
              alt={username}
              className="w-[62px] h-[62px] rounded-full object-cover"
            />
          </div>
        </div>

        {isLive && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-1 px-1.5 py-[1px] rounded-md text-[9px] font-bold tracking-wider text-white z-10"
            style={{
              background: '#FF1744',
              boxShadow: '0 2px 8px rgba(255,23,68,0.55), 0 0 0 1.5px #000',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            LIVE
          </motion.div>
        )}

        {isOwn && !isLive && (
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
