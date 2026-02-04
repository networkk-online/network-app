import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pin, Crown } from 'lucide-react';

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
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

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
            <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-3 py-2 flex items-start gap-2">
              <Pin className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">
                  <span className="font-bold text-yellow-400">{pinnedComment.username}</span>
                  {' '}
                  <span>{pinnedComment.message}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      <div 
        ref={scrollRef}
        className="space-y-2 overflow-y-auto max-h-full scrollbar-hide"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 100%)' }}
      >
        <AnimatePresence initial={false}>
          {comments.slice(-30).map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                stiffness: 500, 
                damping: 30,
                delay: index * 0.02
              }}
              onClick={() => isHost && onPinComment?.(comment)}
              className={`group flex items-start gap-2 ${
                isHost ? 'cursor-pointer hover:bg-white/5 rounded-lg p-1 -m-1' : ''
              }`}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={comment.avatar} />
                <AvatarFallback className={`text-xs ${
                  comment.isHost 
                    ? 'bg-gradient-to-br from-pink-500 to-red-500' 
                    : comment.isTopGifter 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                }`}>
                  {comment.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1 bg-black/30 backdrop-blur-sm rounded-2xl px-3 py-1.5">
                <p className="text-sm">
                  {/* Username with badges */}
                  <span className={`font-bold ${
                    comment.isHost 
                      ? 'text-pink-400' 
                      : comment.isTopGifter 
                        ? 'text-yellow-400'
                        : 'text-cyan-400'
                  }`}>
                    {comment.isHost && '🎙️ '}
                    {comment.isTopGifter && <Crown className="w-3 h-3 inline text-yellow-400 mr-0.5" />}
                    {comment.username}
                  </span>
                  {' '}
                  <span className="text-white/90">{comment.message}</span>
                </p>
                
                {/* Translation */}
                {comment.isTranslated && comment.originalMessage && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    🌐 {comment.originalMessage}
                  </p>
                )}
              </div>

              {/* Pin button for host */}
              {isHost && (
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Pin className="w-4 h-4 text-gray-400 hover:text-yellow-400" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
