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
  Eye
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
  GiftComboEngine,
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
      {/* ═══ TOP BAR ═══ */}
      <div className="absolute top-0 left-0 right-0 p-3 pointer-events-auto">
        <div className="flex items-start justify-between">
          {/* Streamer info pill */}
          <div className="flex items-center gap-2">
            <motion.div 
              className="flex items-center gap-2 bg-black/50 backdrop-blur-xl rounded-full pl-1 pr-3 py-1 border border-white/10"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <div className="relative">
                <Avatar className="w-9 h-9 ring-2 ring-[#19e05b]">
                  <AvatarImage src={streamerAvatar} />
                  <AvatarFallback className="bg-[#19e05b] text-black font-bold">
                    {streamerName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm leading-tight">{streamerName}</span>
                <div className="flex items-center gap-1 text-[11px] text-white/60">
                  <Eye className="w-3 h-3" />
                  <span>{viewerCount.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            {/* LIVE badge */}
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(25, 224, 91, 0)',
                  '0 0 12px 4px rgba(25, 224, 91, 0.4)',
                  '0 0 0 0 rgba(25, 224, 91, 0)',
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-gradient-to-r from-red-500 to-[#19e05b] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
            >
              ● LIVE
            </motion.div>

            {/* Follow button */}
            {!isFollowing && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onFollow}
                className="bg-[#19e05b] text-black font-bold text-xs px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(25,224,91,0.3)]"
              >
                متابعة
              </motion.button>
            )}
          </div>

          {/* Top right controls */}
          <div className="flex items-center gap-1.5">
            <TopGiftersBar gifters={topGifters} />

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTranslation}
              className={cn(
                "w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10",
                translationEnabled && "border-[#19e05b]/50 bg-[#19e05b]/20"
              )}
            >
              <Languages className="w-4 h-4 text-white" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ PK BATTLE ═══ */}
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

      {/* Gift Combo Engine */}
      <GiftComboEngine onSendGift={onSendGift} />

      {/* ═══ TWITCH-STYLE CHAT — Bottom Left ═══ */}
      <div className="absolute bottom-20 left-0 right-20 max-h-[35%] pointer-events-auto px-3">
        <LiveComments 
          comments={comments}
          pinnedComment={pinnedComment}
          onPinComment={isHost ? handlePinComment : undefined}
          isHost={isHost}
        />
        <div ref={commentsEndRef} />
      </div>

      {/* ═══ RIGHT SIDE ACTION BUTTONS ═══ */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-3 pointer-events-auto">
        {[
          { icon: <Gift className="w-5 h-5 text-yellow-400" />, action: () => setShowGiftPanel(true) },
          { icon: <Share2 className="w-5 h-5 text-white" />, action: () => setShowShareSheet(true) },
          { icon: <Swords className="w-5 h-5 text-white" />, action: () => setShowPK(true) },
          { icon: <MoreVertical className="w-5 h-5 text-white" />, action: () => {} },
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={btn.action}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            {btn.icon}
          </motion.button>
        ))}
      </div>

      {/* ═══ BOTTOM INPUT BAR ═══ */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl rounded-full border border-white/10 pl-4 pr-1 py-1">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="أرسل تعليقاً..."
            className="bg-transparent border-0 text-white placeholder:text-white/40 h-9 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowGiftPanel(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
            >
              <Gift className="w-4 h-4 text-yellow-400" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSendComment}
              className="w-9 h-9 rounded-full bg-[#19e05b] flex items-center justify-center shadow-[0_0_10px_rgba(25,224,91,0.3)]"
            >
              <Send className="w-4 h-4 text-black" />
            </motion.button>
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
