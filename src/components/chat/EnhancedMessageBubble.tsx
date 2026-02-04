import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, CheckCheck, Play, Pause, Download, Eye, Heart, Image as ImageIcon, Video, Mic, FileText, Reply } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
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
  duration?: number;
  isOwn: boolean;
  timestamp: Date;
  isRead?: boolean;
  isDelivered?: boolean;
  reactions?: MessageReaction[];
  replyTo?: ReplyToMessage;
  senderName?: string;
  senderAvatar?: string;
  // Reader info for read receipts - shows avatar when message is read
  readerAvatar?: string;
  readerName?: string;
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

// Format time with proper validation
const formatTime = (timestamp: Date): string => {
  try {
    const date = timestamp instanceof Date ? timestamp : parseISO(String(timestamp));
    if (!isValid(date)) return '--:--';
    return format(date, 'h:mm a', { locale: ar });
  } catch {
    return '--:--';
  }
};

// Format duration in mm:ss
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size with proper rounding
const formatFileSize = (bytes?: number | string): string => {
  if (!bytes) return 'غير معروف';
  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(numBytes)) return 'غير معروف';
  
  if (numBytes < 1024) return `${numBytes} B`;
  if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(1)} KB`;
  return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const EnhancedMessageBubble = ({
  id,
  content,
  mediaUrl,
  mediaType,
  fileName,
  fileSize,
  duration: propDuration,
  isOwn,
  timestamp,
  isRead = false,
  isDelivered = false,
  reactions = [],
  replyTo,
  senderName,
  senderAvatar,
  readerAvatar,
  readerName,
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
  const [voiceDuration, setVoiceDuration] = useState(propDuration || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [heartParticles, setHeartParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const messageRef = useRef<HTMLDivElement>(null);

  // Swipe to reply gesture
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, [0, 40, 80], [0, 0.5, 1]);
  const replyScale = useTransform(x, [0, 40, 80], [0.5, 0.8, 1]);

  const time = formatTime(timestamp);
  const urls = content?.match(urlRegex) || [];
  
  // Generate consistent waveform bars based on message id
  const waveformBars = useMemo(() => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 40 }, (_, i) => {
      const random = Math.sin(seed + i * 1.5) * 0.5 + 0.5;
      return random * 20 + 6;
    });
  }, [id]);

  // Audio duration loading
  useEffect(() => {
    if (mediaType === 'voice' && audioRef.current && mediaUrl) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          setVoiceDuration(audio.duration);
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.load(); // Force load the audio metadata
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [mediaUrl, mediaType]);

  // Double-tap to heart handler with burst animation
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - trigger heart reaction with burst
      triggerHapticFeedback();
      setShowHeartAnimation(true);
      onReaction?.('❤️');
      
      // Create burst particles
      const rect = messageRef.current?.getBoundingClientRect();
      if (rect) {
        const particles = Array.from({ length: 8 }, (_, i) => ({
          id: Date.now() + i,
          x: Math.cos((i / 8) * Math.PI * 2) * 50,
          y: Math.sin((i / 8) * Math.PI * 2) * 50
        }));
        setHeartParticles(particles);
      }
      
      setTimeout(() => {
        setShowHeartAnimation(false);
        setHeartParticles([]);
      }, 1200);
    }
    lastTapRef.current = now;
  }, [onReaction]);

  // Haptic feedback simulation
  const triggerHapticFeedback = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    triggerHapticFeedback();
    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
    setContextMenu({ x: clientX, y: clientY });
  };

  const handleLongPressStart = useCallback(() => {
    setIsPressed(true);
    longPressTimer.current = setTimeout(() => {
      triggerHapticFeedback();
      if (messageRef.current) {
        const rect = messageRef.current.getBoundingClientRect();
        setContextMenu({ x: rect.left + rect.width / 2, y: rect.top });
      }
    }, 500);
  }, [triggerHapticFeedback]);

  const handleLongPressEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Swipe to reply handler
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 60) {
      triggerHapticFeedback();
      onReply?.();
    }
  }, [onReply, triggerHapticFeedback]);

  const toggleVoicePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Load and play for proper audio handling
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Audio play error:', err);
        });
      }
    }
  }, [isPlaying]);

  const handleAudioTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    if (audio.duration && isFinite(audio.duration)) {
      setVoiceProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setVoiceProgress(0);
    setCurrentTime(0);
  }, []);

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
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl mb-2 border-r-2',
          isOwn 
            ? 'bg-white/10 border-r-white/30' 
            : 'bg-white/5 border-r-[#833AB4]'
        )}
      >
        <Reply className="w-3.5 h-3.5 text-white/40 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#833AB4]">
            {replyTo.isOwn ? 'أنت' : replyTo.senderName}
          </p>
          <div className="flex items-center gap-1 text-xs text-white/60 truncate">
            {getMediaIcon()}
            <span className="truncate">
              {replyTo.content || (replyTo.mediaType === 'image' ? 'صورة' : replyTo.mediaType === 'video' ? 'فيديو' : replyTo.mediaType === 'voice' ? 'رسالة صوتية' : 'مرفق')}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMedia = () => {
    if (!mediaUrl) return null;

    switch (mediaType) {
      case 'image':
        return (
          <motion.div 
            className="relative mb-2 cursor-pointer overflow-hidden rounded-2xl"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={mediaUrl}
              alt="Shared media"
              className="max-h-72 w-auto object-cover shadow-xl"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md flex items-center gap-1">
              <Eye className="w-3 h-3 text-white/70" />
            </div>
          </motion.div>
        );

      case 'video':
        return (
          <motion.div className="relative mb-2 rounded-2xl overflow-hidden shadow-xl">
            <video
              src={mediaUrl}
              controls
              className="max-h-72 w-auto rounded-2xl"
              poster={mediaUrl.replace(/\.[^/.]+$/, '_thumb.jpg')}
            />
          </motion.div>
        );

      case 'voice':
        return (
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-[22px] min-w-[220px] shadow-lg',
            isOwn
              ? 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]'
              : 'bg-[#262626]'
          )}>
            <audio
              ref={audioRef}
              src={mediaUrl}
              preload="metadata"
              onEnded={handleAudioEnded}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={(e) => {
                const audio = e.target as HTMLAudioElement;
                if (audio.duration && isFinite(audio.duration)) {
                  setVoiceDuration(audio.duration);
                }
              }}
            />
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfig}
              onClick={toggleVoicePlay}
              className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-lg"
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
                      backgroundColor: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.4)'
                    }}
                    transition={{ 
                      repeat: isPlaying ? Infinity : 0, 
                      duration: 0.6,
                      delay: i * 0.015
                    }}
                    className="w-[3px] rounded-full"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
            
            <span className="text-xs text-white/80 shrink-0 font-mono tabular-nums min-w-[36px] text-right">
              {isPlaying ? formatDuration(currentTime) : formatDuration(voiceDuration)}
            </span>
          </div>
        );

      case 'document':
        return (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg cursor-pointer',
              isOwn ? 'bg-white/10' : 'bg-[#262626]'
            )}
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{fileName || 'مستند'}</p>
              <p className="text-xs text-white/50">{formatFileSize(fileSize)}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Download className="w-4 h-4 text-white/70" />
            </motion.button>
          </motion.div>
        );

      case 'sticker':
      case 'gif':
        return (
          <motion.img
            src={mediaUrl}
            alt={mediaType === 'sticker' ? 'Sticker' : 'GIF'}
            className="max-h-40 w-auto rounded-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          'rounded-[22px] px-4 py-3 shadow-2xl font-[Inter]',
          isOwn
            ? 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C] text-white'
            : 'bg-[#262626] text-white'
        )}
        style={{
          boxShadow: isOwn 
            ? '0 8px 25px rgba(131, 58, 180, 0.35)' 
            : '0 4px 15px rgba(0, 0, 0, 0.4)'
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
                className="text-blue-300 underline hover:text-blue-200 transition-colors"
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

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    return Object.entries(
      reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
  }, [reactions]);

  return (
    <>
      {/* Swipe Reply Indicator */}
      <motion.div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none',
          isOwn ? 'hidden' : ''
        )}
        style={{ opacity: replyOpacity, scale: replyScale }}
      >
        <div className="w-9 h-9 rounded-full bg-[#833AB4]/30 backdrop-blur-md flex items-center justify-center border border-white/10">
          <Reply className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      <motion.div
        ref={messageRef}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: isPressed ? 0.95 : 1 
        }}
        transition={springConfig}
        drag={!isOwn ? 'x' : false}
        dragConstraints={{ left: 0, right: 80 }}
        dragElastic={0.15}
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
          {/* Double-tap Heart Burst Animation */}
          <AnimatePresence>
            {showHeartAnimation && (
              <>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={bounceSpring}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
                </motion.div>
                {/* Burst particles */}
                {heartParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{ 
                      scale: [0, 1, 0.5],
                      x: particle.x,
                      y: particle.y,
                      opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
                  >
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                  </motion.div>
                ))}
              </>
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
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 space-y-2"
            >
              {urls.slice(0, 1).map((url, i) => (
                <LinkPreview key={i} url={url} />
              ))}
            </motion.div>
          )}

          {/* Reactions */}
          {groupedReactions.length > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={bounceSpring}
              className={cn(
                'flex items-center gap-1 mt-1.5 px-1',
                isOwn ? 'justify-start' : 'justify-end'
              )}
            >
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-[#1C1C1E] border border-white/10 shadow-lg">
                {groupedReactions.map(([emoji, count], index) => (
                  <motion.span 
                    key={emoji} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05, ...bounceSpring }}
                    className="text-sm cursor-pointer hover:scale-125 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHapticFeedback();
                      onReaction?.(emoji);
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {emoji}
                    {count > 1 && <span className="text-[10px] text-white/60 ml-0.5 font-mono">{count}</span>}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Time & Status with Reader Avatar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'flex items-center gap-1.5 mt-1 px-2',
              isOwn ? 'justify-start' : 'justify-end'
            )}
          >
            <span className="text-[11px] text-white/40 font-[Inter] tabular-nums">{time}</span>
            {isOwn && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={bounceSpring}
                className="flex items-center"
              >
                {isRead ? (
                  readerAvatar ? (
                    // Instagram-style: Show reader's avatar when message is read
                    <div className="relative">
                      <img
                        src={readerAvatar}
                        alt={readerName || 'Seen by'}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-black"
                      />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, ...bounceSpring }}
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#00bfff] rounded-full border border-black"
                      />
                    </div>
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-[#00bfff]" />
                  )
                ) : isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5 text-white/40" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white/40" />
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <MessageContextMenu
            isOpen={true}
            onClose={() => setContextMenu(null)}
            position={contextMenu}
            isOwn={isOwn}
            onReply={() => { onReply?.(); setContextMenu(null); }}
            onReaction={(emoji) => { onReaction?.(emoji); setContextMenu(null); }}
            onCopy={() => { onCopy?.(); setContextMenu(null); }}
            onForward={() => { onForward?.(); setContextMenu(null); }}
            onReport={() => { onReport?.(); setContextMenu(null); }}
            onDeleteForMe={() => { onDeleteForMe?.(); setContextMenu(null); }}
            onDeleteForEveryone={onDeleteForEveryone ? () => { onDeleteForEveryone(); setContextMenu(null); } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={showLightbox && mediaType === 'image'}
        imageUrl={mediaUrl || ''}
        onClose={() => setShowLightbox(false)}
      />
    </>
  );
};
