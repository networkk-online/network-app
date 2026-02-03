import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, CheckCheck, Play, Pause, Download, Eye, Heart, ThumbsUp, Image as ImageIcon, Video, Mic, FileText, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ImageLightbox } from './ImageLightbox';
import { LinkPreview } from './LinkPreview';
import { MessageContextMenu } from './MessageContextMenu';

export interface MessageReaction {
  emoji: string;
  userId: string;
  username?: string;
  count?: number;
  userReacted?: boolean;
}

export interface ReplyToMessage {
  id: string;
  content?: string;
  mediaType?: 'image' | 'video' | 'voice' | 'document' | 'sticker' | 'gif';
  senderName: string;
  isOwn: boolean;
}

export interface EnhancedMessageBubbleProps {
  id: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'voice' | 'document' | 'sticker' | 'gif';
  fileName?: string;
  fileSize?: string;
  isOwn: boolean;
  timestamp: Date;
  isRead?: boolean;
  isDelivered?: boolean;
  reactions?: MessageReaction[];
  replyTo?: ReplyToMessage;
  senderName?: string;
  senderAvatar?: string;
  onReply?: () => void;
  onReaction?: (emoji: string) => void;
  onCopy?: () => void;
  onForward?: () => void;
  onReport?: () => void;
  onDeleteForMe?: () => void;
  onDeleteForEveryone?: () => void;
}

// URL detection regex
const urlRegex = /(https?:\/\/[^\s]+)/g;

// Spring animation config for Instagram-like feel
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8
};

const bounceSpring = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 15
};

export const EnhancedMessageBubble = ({
  id,
  content,
  mediaUrl,
  mediaType,
  fileName,
  fileSize,
  isOwn,
  timestamp,
  isRead = false,
  isDelivered = false,
  reactions = [],
  replyTo,
  senderName,
  senderAvatar,
  onReply,
  onReaction,
  onCopy,
  onForward,
  onReport,
  onDeleteForMe,
  onDeleteForEveryone,
}: EnhancedMessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const messageRef = useRef<HTMLDivElement>(null);

  // Swipe to reply gesture
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [0, 60, 100], [0, 0.5, 1]);
  const replyScale = useTransform(x, [0, 60, 100], [0.5, 0.8, 1]);

  const time = format(timestamp, 'h:mm a', { locale: ar });
  const urls = content?.match(urlRegex) || [];
  const waveformBars = Array.from({ length: 32 }, () => Math.random() * 20 + 4);

  // Double-tap to heart handler
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger heart reaction
      triggerHapticFeedback();
      setShowHeartAnimation(true);
      onReaction?.('❤️');
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  }, [onReaction]);

  // Haptic feedback simulation
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    triggerHapticFeedback();
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
    setContextMenu({ x: clientX, y: clientY });
  };

  const handleLongPressStart = () => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      triggerHapticFeedback();
      if (messageRef.current) {
        const rect = messageRef.current.getBoundingClientRect();
        setContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Swipe to reply handler
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80) {
      triggerHapticFeedback();
      onReply?.();
    }
  };

  const toggleVoicePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderReplyPreview = () => {
    if (!replyTo) return null;

    const getMediaIcon = () => {
      switch (replyTo.mediaType) {
        case 'image': return <ImageIcon className="w-3 h-3" />;
        case 'video': return <Video className="w-3 h-3" />;
        case 'voice': return <Mic className="w-3 h-3" />;
        case 'document': return <FileText className="w-3 h-3" />;
        default: return null;
      }
    };

    return (
      <div 
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl mb-2 border-r-2',
          isOwn 
            ? 'bg-white/10 border-r-white/30' 
            : 'bg-white/5 border-r-[#833AB4]'
        )}
      >
        <Reply className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium text-[#833AB4]">
            {replyTo.isOwn ? 'أنت' : replyTo.senderName}
          </p>
          <div className="flex items-center gap-1 text-xs text-white/60 truncate">
            {getMediaIcon()}
            <span className="truncate">
              {replyTo.content || (replyTo.mediaType === 'image' ? 'صورة' : replyTo.mediaType === 'video' ? 'فيديو' : replyTo.mediaType === 'voice' ? 'رسالة صوتية' : 'مرفق')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderMedia = () => {
    if (!mediaUrl) return null;

    switch (mediaType) {
      case 'image':
        return (
          <motion.div 
            className="relative mb-2 cursor-pointer"
            whileHover={{ scale: 1.01 }}
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={mediaUrl}
              alt="Shared media"
              className="rounded-2xl max-h-72 w-auto object-cover shadow-lg"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm flex items-center gap-1">
              <Eye className="w-3 h-3 text-white/70" />
            </div>
          </motion.div>
        );

      case 'video':
        return (
          <motion.div className="relative mb-2 rounded-2xl overflow-hidden">
            <video
              src={mediaUrl}
              controls
              className="max-h-72 w-auto rounded-2xl shadow-lg"
              poster={mediaUrl.replace(/\.[^/.]+$/, '_thumb.jpg')}
            />
          </motion.div>
        );

      case 'voice':
        return (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-[22px] min-w-[200px]',
            isOwn
              ? 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]'
              : 'bg-[#262626]'
          )}>
            <audio
              ref={audioRef}
              src={mediaUrl}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => {
                const audio = e.target as HTMLAudioElement;
                setVoiceProgress((audio.currentTime / audio.duration) * 100);
              }}
            />
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVoicePlay}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </motion.button>
            
            <div className="flex-1 h-8 flex items-end gap-[2px]">
              {waveformBars.map((height, i) => {
                const isActive = (i / waveformBars.length) * 100 <= voiceProgress;
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 4 }}
                    animate={{ 
                      height: isPlaying ? [height * 0.5, height, height * 0.5] : height,
                    }}
                    transition={{ 
                      repeat: isPlaying ? Infinity : 0, 
                      duration: 0.5,
                      delay: i * 0.02
                    }}
                    className={cn(
                      'w-[3px] rounded-full transition-colors',
                      isActive ? 'bg-white' : 'bg-white/40'
                    )}
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
            
            <span className="text-xs text-white/70 shrink-0">0:32</span>
          </div>
        );

      case 'document':
        return (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-2xl',
            isOwn ? 'bg-white/10' : 'bg-[#262626]'
          )}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{fileName || 'مستند'}</p>
              <p className="text-xs text-white/50">{fileSize || 'غير معروف'}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Download className="w-4 h-4 text-white/70" />
            </motion.button>
          </div>
        );

      case 'sticker':
      case 'gif':
        return (
          <motion.img
            src={mediaUrl}
            alt={mediaType === 'sticker' ? 'Sticker' : 'GIF'}
            className="max-h-40 w-auto"
            whileHover={{ scale: 1.05 }}
          />
        );

      default:
        return null;
    }
  };

  const renderTextContent = () => {
    if (!content) return null;

    const parts = content.split(urlRegex);
    
    return (
      <motion.div
        className={cn(
          'rounded-[20px] px-4 py-2.5 shadow-lg font-[Inter]',
          isOwn
            ? 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C] text-white'
            : 'bg-[#262626] text-white'
        )}
        style={{
          boxShadow: isOwn 
            ? '0 4px 15px rgba(131, 58, 180, 0.3)' 
            : '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}
      >
        <p className="text-[15px] leading-relaxed break-words font-[Inter]" dir="auto">
          {parts.map((part, i) => 
            urlRegex.test(part) ? (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline hover:text-blue-200"
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      </motion.div>
    );
  };

  return (
    <>
      {/* Swipe Reply Indicator */}
      <motion.div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center',
          isOwn ? 'hidden' : ''
        )}
        style={{ opacity: replyOpacity, scale: replyScale }}
      >
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <Reply className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      <motion.div
        ref={messageRef}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: isPressed ? 0.96 : 1 
        }}
        transition={springConfig}
        drag={!isOwn ? 'x' : false}
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x: !isOwn ? x : undefined }}
        className={cn('flex relative', isOwn ? 'justify-end' : 'justify-start')}
        onContextMenu={handleContextMenu}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onClick={handleTap}
      >
        <div className="max-w-[75%] relative">
          {/* Double-tap Heart Animation */}
          <AnimatePresence>
            {showHeartAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={bounceSpring}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <Heart className="w-16 h-16 text-red-500 fill-red-500 drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Reply Preview */}
          {renderReplyPreview()}

          {/* Media Content */}
          {renderMedia()}

          {/* Text Content */}
          {renderTextContent()}

          {/* Link Previews */}
          {urls.length > 0 && (
            <div className="mt-2 space-y-2">
              {urls.slice(0, 1).map((url, i) => (
                <LinkPreview key={i} url={url} />
              ))}
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center gap-1 mt-1 px-2',
                isOwn ? 'justify-start' : 'justify-end'
              )}
            >
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-[#262626] border border-white/10">
                {/* Group reactions by emoji */}
                {Object.entries(
                  reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <motion.span 
                    key={emoji} 
                    className="text-sm cursor-pointer hover:scale-125 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReaction?.(emoji);
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                    {count > 1 && <span className="text-[10px] text-white/60 ml-0.5">{count}</span>}
                  </motion.span>
                ))}
              </div>
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

      {/* Image Lightbox */}
      {mediaType === 'image' && mediaUrl && (
        <ImageLightbox
          isOpen={showLightbox}
          imageUrl={mediaUrl}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Context Menu */}
      <MessageContextMenu
        isOpen={!!contextMenu}
        position={contextMenu || { x: 0, y: 0 }}
        isOwn={isOwn}
        onClose={() => setContextMenu(null)}
        onReply={() => onReply?.()}
        onCopy={() => {
          if (content) navigator.clipboard.writeText(content);
          onCopy?.();
        }}
        onForward={() => onForward?.()}
        onReport={() => onReport?.()}
        onDeleteForMe={() => onDeleteForMe?.()}
        onDeleteForEveryone={onDeleteForEveryone}
        onReaction={(emoji) => onReaction?.(emoji)}
        canDeleteForEveryone={isOwn}
      />
    </>
  );
};
