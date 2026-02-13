import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Crown, Shield } from 'lucide-react';

export interface LiveComment {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  isTranslated?: boolean;
  originalMessage?: string;
  isPinned?: boolean;
  isHost?: boolean;
  isTopGifter?: boolean;
  isVIP?: boolean;
  isModerator?: boolean;
}

interface LiveCommentsProps {
  comments: LiveComment[];
  pinnedComment?: LiveComment | null;
  onPinComment?: (comment: LiveComment) => void;
  isHost?: boolean;
}

export const LiveComments = ({ 
  comments, 
  pinnedComment, 
  onPinComment,
  isHost = false 
}: LiveCommentsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const getUsernameColor = (comment: LiveComment) => {
    if (comment.isHost) return 'text-[#19e05b]';
    if (comment.isVIP || comment.isTopGifter) return 'text-[#19e05b]';
    if (comment.isModerator) return 'text-blue-400';
    return 'text-white/70';
  };

  return (
    <div className="relative h-full">
      {/* Pinned Comment */}
      <AnimatePresence>
        {pinnedComment && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-2"
          >
            <div className="bg-[#19e05b]/10 backdrop-blur-md border border-[#19e05b]/30 rounded-2xl px-3 py-2 flex items-start gap-2">
              <Pin className="w-4 h-4 text-[#19e05b] mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-bold text-[#19e05b]">{pinnedComment.username}</span>
                  {' '}
                  <span>{pinnedComment.message}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Twitch-style Chat List */}
      <div 
        ref={scrollRef}
        className="space-y-1 overflow-y-auto max-h-full scrollbar-hide"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 100%)' }}
      >
        <AnimatePresence initial={false}>
          {comments.slice(-40).map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 30,
              }}
              onClick={() => isHost && onPinComment?.(comment)}
              className={`group px-2 py-0.5 rounded-lg ${
                isHost ? 'cursor-pointer hover:bg-white/5' : ''
              }`}
            >
              <p className="text-[13px] leading-relaxed">
                {/* Badges */}
                {comment.isHost && (
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-[#19e05b] rounded mr-1 align-middle">
                    <span className="text-[8px] text-black font-black">🎙</span>
                  </span>
                )}
                {comment.isTopGifter && (
                  <Crown className="w-3.5 h-3.5 inline text-yellow-400 mr-1 align-middle" />
                )}
                {comment.isModerator && (
                  <Shield className="w-3.5 h-3.5 inline text-blue-400 mr-1 align-middle" />
                )}

                {/* Username */}
                <span className={`font-bold ${getUsernameColor(comment)}`}>
                  {comment.username}
                </span>
                <span className="text-white/40 mx-1">:</span>
                {/* Message */}
                <span className="text-white/90">{comment.message}</span>
              </p>
              
              {/* Translation */}
              {comment.isTranslated && comment.originalMessage && (
                <p className="text-[11px] text-white/40 mt-0.5 pl-5">
                  🌐 {comment.originalMessage}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
