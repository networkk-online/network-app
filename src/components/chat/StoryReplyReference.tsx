import { memo } from 'react';
import { motion } from 'framer-motion';
import { Reply, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryReplyReferenceProps {
  storyThumbnail: string;
  storyMediaType?: 'image' | 'video';
  ownerName: string;
  ownerAvatar?: string;
  isOwn: boolean;
  onClick?: () => void;
}

export const StoryReplyReference = memo(({
  storyThumbnail,
  storyMediaType = 'image',
  ownerName,
  ownerAvatar,
  isOwn,
  onClick
}: StoryReplyReferenceProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-2xl mb-2 cursor-pointer',
        'border border-white/10',
        isOwn ? 'bg-white/10' : 'bg-[#1C1C1E]'
      )}
    >
      {/* Story Thumbnail */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0">
        <img
          src={storyThumbnail}
          alt="Story"
          className="w-full h-full object-cover"
        />
        {storyMediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-4 h-4 text-white" fill="white" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Story info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Reply className="w-3 h-3 text-[#833AB4]" />
          <span className="text-[10px] text-[#833AB4] font-medium">رد على القصة</span>
        </div>
        <div className="flex items-center gap-2">
          {ownerAvatar && (
            <img
              src={ownerAvatar}
              alt={ownerName}
              className="w-5 h-5 rounded-full border border-white/20"
            />
          )}
          <span className="text-xs text-white/70 truncate">
            {isOwn ? 'قصتك' : `قصة ${ownerName}`}
          </span>
        </div>
      </div>

      {/* View indicator */}
      <div className="shrink-0 px-2 py-1 rounded-full bg-white/10">
        <span className="text-[10px] text-white/50">عرض</span>
      </div>
    </motion.div>
  );
});

StoryReplyReference.displayName = 'StoryReplyReference';
