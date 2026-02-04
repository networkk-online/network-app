import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Gift, 
  MessageCircle, 
  Share2, 
  Users, 
  X, 
  Crown,
  Star,
  Sparkles,
  Languages,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LiveComment {
  id: string;
  username: string;
  avatar?: string;
  message: string;
  isTranslated?: boolean;
  originalMessage?: string;
}

interface LiveGift {
  id: string;
  username: string;
  giftType: 'rose' | 'heart' | 'star' | 'crown' | 'diamond';
  amount: number;
}

interface FlyingHeart {
  id: string;
  x: number;
  color: string;
}

interface TikTokLiveOverlayProps {
  streamerName: string;
  streamerAvatar?: string;
  viewerCount: number;
  isFollowing?: boolean;
  onFollow?: () => void;
  onClose: () => void;
  onSendComment: (message: string) => void;
  onSendGift?: (giftType: string) => void;
  comments: LiveComment[];
  translationEnabled?: boolean;
  onToggleTranslation?: () => void;
}

const GIFT_ICONS: Record<string, { icon: string; color: string }> = {
  rose: { icon: '🌹', color: '#ff4757' },
  heart: { icon: '💖', color: '#ff6b81' },
  star: { icon: '⭐', color: '#ffd32a' },
  crown: { icon: '👑', color: '#f9ca24' },
  diamond: { icon: '💎', color: '#70a1ff' },
};

export const TikTokLiveOverlay = ({
  streamerName,
  streamerAvatar,
  viewerCount,
  isFollowing = false,
  onFollow,
  onClose,
  onSendComment,
  onSendGift,
  comments,
  translationEnabled = false,
  onToggleTranslation
}: TikTokLiveOverlayProps) => {
  const [flyingHearts, setFlyingHearts] = useState<FlyingHeart[]>([]);
  const [giftPopups, setGiftPopups] = useState<LiveGift[]>([]);
  const [newComment, setNewComment] = useState('');
  const [topGifters, setTopGifters] = useState([
    { username: 'سيف123', avatar: '', amount: 500 },
    { username: 'نور_العراق', avatar: '', amount: 350 },
    { username: 'ali_creator', avatar: '', amount: 200 },
  ]);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Add flying heart
  const addHeart = () => {
    const colors = ['#ff4757', '#ff6b81', '#ff9ff3', '#feca57', '#ff6b6b'];
    const newHeart: FlyingHeart = {
      id: Date.now().toString(),
      x: Math.random() * 50 + 25,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    setFlyingHearts(prev => [...prev, newHeart]);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Remove after animation
    setTimeout(() => {
      setFlyingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 3000);
  };

  // Show gift popup
  const showGiftPopup = (gift: LiveGift) => {
    setGiftPopups(prev => [...prev, gift]);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    
    // Remove after animation
    setTimeout(() => {
      setGiftPopups(prev => prev.filter(g => g.id !== gift.id));
    }, 3000);
  };

  // Send comment
  const handleSendComment = () => {
    if (newComment.trim()) {
      onSendComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top section - Streamer info & viewers */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
        <div className="flex items-start justify-between">
          {/* Streamer info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-pink-500">
                <AvatarImage src={streamerAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500">
                  {streamerName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white text-shadow">{streamerName}</h3>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Users className="w-3 h-3" />
                <span>{viewerCount.toLocaleString()}</span>
              </div>
            </div>
            {!isFollowing && (
              <Button
                size="sm"
                onClick={onFollow}
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-4 h-8"
              >
                متابعة
              </Button>
            )}
          </div>

          {/* Top gifters & close */}
          <div className="flex items-center gap-2">
            {/* Top gifters leaderboard */}
            <div className="flex -space-x-2">
              {topGifters.slice(0, 3).map((gifter, i) => (
                <div key={i} className="relative">
                  <Avatar className="w-8 h-8 ring-2 ring-yellow-400">
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-xs">
                      {gifter.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  {i === 0 && (
                    <Crown className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-400" />
                  )}
                </div>
              ))}
            </div>

            {/* Translation toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTranslation}
              className={cn(
                "w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm",
                translationEnabled && "bg-primary/50"
              )}
            >
              <Languages className="w-4 h-4 text-white" />
            </Button>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm"
            >
              <X className="w-5 h-5 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Flying hearts animation */}
      <AnimatePresence>
        {flyingHearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ 
              x: `${heart.x}%`, 
              y: '90%', 
              opacity: 1, 
              scale: 0.5 
            }}
            animate={{ 
              y: '20%', 
              opacity: 0, 
              scale: 1.2,
              x: `${heart.x + (Math.random() - 0.5) * 30}%`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="absolute pointer-events-none"
            style={{ color: heart.color }}
          >
            <Heart className="w-8 h-8 fill-current" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Gift popups */}
      <AnimatePresence>
        {giftPopups.map((gift, index) => (
          <motion.div
            key={gift.id}
            initial={{ x: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute left-4 pointer-events-none"
            style={{ top: `${30 + index * 80}%` }}
          >
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full pl-2 pr-4 py-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500">
                  {gift.username[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">{gift.username}</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg">{GIFT_ICONS[gift.giftType]?.icon}</span>
                  <span className="text-yellow-400 font-bold">x{gift.amount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Comments section - Bottom left */}
      <div className="absolute bottom-24 left-0 right-20 max-h-[35%] pointer-events-auto">
        <ScrollArea className="h-full px-4">
          <div className="space-y-2">
            {comments.map(comment => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 bg-black/20 backdrop-blur-sm rounded-xl px-3 py-2"
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={comment.avatar} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-500">
                    {comment.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/90">
                    <span className="font-semibold text-cyan-400">{comment.username}</span>{' '}
                    <span>{comment.message}</span>
                  </p>
                  {comment.isTranslated && comment.originalMessage && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      🌐 {comment.originalMessage}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Heart button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={addHeart}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
        </motion.button>

        {/* Gift button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            showGiftPopup({
              id: Date.now().toString(),
              username: 'أنت',
              giftType: 'rose',
              amount: 1
            });
            onSendGift?.('rose');
          }}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Gift className="w-6 h-6 text-yellow-400" />
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.button>

        {/* Multi-guest button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Users className="w-6 h-6 text-white" />
        </motion.button>
      </div>

      {/* Bottom input bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="أرسل تعليقاً..."
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-full pr-12"
            />
            <Button
              size="icon"
              onClick={handleSendComment}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
