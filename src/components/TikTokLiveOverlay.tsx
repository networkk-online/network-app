import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Users, 
  X, 
  Languages,
  Send,
  Gift,
  MoreVertical,
  Swords,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  FlyingHearts, 
  GiftAnimation, 
  GiftPanel, 
  LiveComments, 
  TopGiftersBar,
  PKBattle,
  type Gift as GiftType,
  type LiveComment
} from './live';
import { PremiumShareSheet } from './PremiumShareSheet';

interface TikTokLiveOverlayProps {
  streamerName: string;
  streamerAvatar?: string;
  viewerCount: number;
  isFollowing?: boolean;
  onFollow?: () => void;
  onClose: () => void;
  onSendComment: (message: string) => void;
  onSendGift?: (giftType: string, amount: number) => void;
  comments: LiveComment[];
  translationEnabled?: boolean;
  onToggleTranslation?: () => void;
  isHost?: boolean;
  onStartPK?: () => void;
}

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
  onToggleTranslation,
  isHost = false,
  onStartPK
}: TikTokLiveOverlayProps) => {
  const [newComment, setNewComment] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [pinnedComment, setPinnedComment] = useState<LiveComment | null>(null);
  const [showPK, setShowPK] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [topGifters] = useState([
    { id: '1', username: 'سيف123', avatar: '', amount: 500, rank: 1 },
    { id: '2', username: 'نور_العراق', avatar: '', amount: 350, rank: 2 },
    { id: '3', username: 'ali_creator', avatar: '', amount: 200, rank: 3 },
  ]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      onSendComment(newComment);
      setNewComment('');
    }
  };

  const handleSendGift = (giftType: string, amount: number) => {
    const newGift: GiftType = {
      id: Date.now().toString(),
      username: 'أنت',
      giftType: giftType as GiftType['giftType'],
      amount
    };
    setGifts(prev => [...prev, newGift]);
    onSendGift?.(giftType, amount);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  };

  const handlePinComment = (comment: LiveComment) => {
    setPinnedComment(comment);
    if (navigator.vibrate) navigator.vibrate(20);
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
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              >
                LIVE
              </motion.div>
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

          {/* Top gifters & controls */}
          <div className="flex items-center gap-2">
            <TopGiftersBar gifters={topGifters} />

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

      {/* PK Battle Overlay */}
      {showPK && (
        <PKBattle
          player1={{
            id: '1',
            username: streamerName,
            avatar: streamerAvatar,
            hypePoints: 1250,
            gifts: 45,
            comments: 120
          }}
          player2={{
            id: '2',
            username: 'المنافس',
            hypePoints: 980,
            gifts: 32,
            comments: 85
          }}
          duration={180}
          onEnd={(winnerId) => {
            console.log('Winner:', winnerId);
            setTimeout(() => setShowPK(false), 3000);
          }}
        />
      )}

      {/* Gift Animations */}
      <GiftAnimation 
        gifts={gifts} 
        onGiftComplete={(id) => setGifts(prev => prev.filter(g => g.id !== id))}
      />

      {/* Flying Hearts */}
      <FlyingHearts />

      {/* Comments section - Bottom left */}
      <div className="absolute bottom-24 left-0 right-20 max-h-[35%] pointer-events-auto px-4">
        <LiveComments 
          comments={comments}
          pinnedComment={pinnedComment}
          onPinComment={isHost ? handlePinComment : undefined}
          isHost={isHost}
        />
        <div ref={commentsEndRef} />
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-44 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Gift button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowGiftPanel(true)}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10"
        >
          <Gift className="w-6 h-6 text-yellow-400" />
        </motion.button>

        {/* Share button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowShareSheet(true)}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.button>

        {/* Multi-guest / PK button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPK(true)}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10"
        >
          <Swords className="w-6 h-6 text-white" />
        </motion.button>

        {/* More options */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10"
        >
          <MoreVertical className="w-6 h-6 text-white" />
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

      {/* Gift Panel */}
      <GiftPanel 
        isOpen={showGiftPanel}
        onClose={() => setShowGiftPanel(false)}
        onSendGift={handleSendGift}
        userBalance={500}
      />

      {/* Share Sheet */}
      <PremiumShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        content={{
          type: 'post',
          id: 'live-stream',
          creatorName: streamerName,
          creatorAvatar: streamerAvatar
        }}
        shareUrl={`https://network-app.lovable.app/live/${streamerName}`}
      />
    </div>
  );
};
