import { motion } from 'framer-motion';
import { Check, CheckCheck, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MessageBubbleProps {
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'voice';
  isOwn: boolean;
  timestamp: Date;
  isRead?: boolean;
  isDelivered?: boolean;
}

export const MessageBubble = ({
  content,
  mediaUrl,
  mediaType,
  isOwn,
  timestamp,
  isRead = false,
  isDelivered = false
}: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const time = format(timestamp, 'h:mm a', { locale: ar });

  // Generate random waveform heights for voice messages
  const waveformBars = Array.from({ length: 24 }, () => Math.random() * 16 + 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'flex',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div className="max-w-[75%]">
        {/* Media Content */}
        {mediaUrl && (
          <motion.div 
            className="mb-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="Shared media"
                className="rounded-2xl max-h-64 object-cover shadow-lg"
              />
            ) : mediaType === 'voice' ? (
              <div 
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-3xl backdrop-blur-md',
                  isOwn
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500'
                    : 'bg-white/10'
                )}
              >
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </motion.button>
                <div className="flex-1 h-8 flex items-center gap-0.5">
                  {waveformBars.map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ 
                        height: isPlaying ? [height, height * 0.5, height] : height,
                        opacity: isPlaying && i <= 12 ? 0.5 : 1 
                      }}
                      transition={{ 
                        repeat: isPlaying ? Infinity : 0, 
                        duration: 0.5,
                        delay: i * 0.02
                      }}
                      className="w-1 bg-white/70 rounded-full"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/70">0:32</span>
              </div>
            ) : (
              <video
                src={mediaUrl}
                controls
                className="rounded-2xl max-h-64 shadow-lg"
              />
            )}
          </motion.div>
        )}

        {/* Text Content */}
        {content && (
          <motion.div
            className={cn(
              'rounded-3xl px-4 py-2.5 backdrop-blur-md shadow-lg',
              isOwn
                ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 text-white'
                : 'bg-white/10 text-white border border-white/10'
            )}
          >
            <p className="text-sm leading-relaxed break-words">{content}</p>
          </motion.div>
        )}

        {/* Time & Status */}
        <div className={cn(
          'flex items-center gap-1.5 mt-1 px-2',
          isOwn ? 'justify-start' : 'justify-end'
        )}>
          <span className="text-[10px] text-white/50">{time}</span>
          {isOwn && (
            <span className="flex items-center">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
              ) : isDelivered ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/40" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
