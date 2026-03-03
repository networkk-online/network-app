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

  const waveformBars = Array.from({ length: 24 }, () => Math.random() * 16 + 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
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
                className="rounded-2xl max-h-64 object-cover"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
            ) : mediaType === 'voice' ? (
              <div 
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-[20px] backdrop-blur-xl',
                  isOwn
                    ? 'bg-white/[0.07] border border-white/[0.1]'
                    : 'bg-white/[0.04] border border-white/[0.06]'
                )}
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.06)' }}
              >
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center border border-white/[0.06]"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white/80" />
                  ) : (
                    <Play className="w-4 h-4 text-white/80 ml-0.5" />
                  )}
                </motion.button>
                <div className="flex-1 h-8 flex items-center gap-0.5">
                  {waveformBars.map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ 
                        height: isPlaying ? [height, height * 0.5, height] : height,
                        opacity: isPlaying && i <= 12 ? 0.4 : 0.6
                      }}
                      transition={{ 
                        repeat: isPlaying ? Infinity : 0, 
                        duration: 0.5,
                        delay: i * 0.02
                      }}
                      className="w-[3px] bg-white/50 rounded-full"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-white/40">0:32</span>
              </div>
            ) : (
              <video
                src={mediaUrl}
                controls
                className="rounded-2xl max-h-64"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
            )}
          </motion.div>
        )}

        {/* Text Content — Crystal droplet bubbles */}
        {content && (
          <motion.div
            className={cn(
              'rounded-[20px] px-4 py-2.5 max-w-full relative overflow-hidden',
              isOwn
                ? 'bg-white/[0.07] border border-white/[0.1] text-white/95'
                : 'bg-white/[0.04] border border-white/[0.06] text-white/85'
            )}
            style={{
              boxShadow: isOwn 
                ? '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.08)' 
                : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Specular shine */}
            <div className="absolute inset-0 rounded-inherit pointer-events-none"
                 style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />
            <p className="text-[15px] leading-relaxed break-words relative z-10">{content}</p>
          </motion.div>
        )}

        {/* Time & Status */}
        <div className={cn(
          'flex items-center gap-1.5 mt-1 px-2',
          isOwn ? 'justify-start' : 'justify-end'
        )}>
          <span className="text-[10px] text-white/30">{time}</span>
          {isOwn && (
            <span className="flex items-center">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-primary/70" />
              ) : isDelivered ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/25" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/25" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
