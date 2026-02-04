import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Gift {
  id: string;
  username: string;
  avatar?: string;
  giftType: 'rose' | 'heart' | 'star' | 'crown' | 'diamond' | 'lion' | 'rocket' | 'galaxy';
  amount: number;
}

interface GiftAnimationProps {
  gifts: Gift[];
  onGiftComplete?: (giftId: string) => void;
}

const GIFT_CONFIG: Record<string, { icon: string; color: string; size: 'sm' | 'md' | 'lg' | 'xl'; sound?: boolean }> = {
  rose: { icon: '🌹', color: '#ff4757', size: 'sm' },
  heart: { icon: '💖', color: '#ff6b81', size: 'sm' },
  star: { icon: '⭐', color: '#ffd32a', size: 'md' },
  crown: { icon: '👑', color: '#f9ca24', size: 'md', sound: true },
  diamond: { icon: '💎', color: '#70a1ff', size: 'lg', sound: true },
  lion: { icon: '🦁', color: '#ff9f43', size: 'lg', sound: true },
  rocket: { icon: '🚀', color: '#5f27cd', size: 'xl', sound: true },
  galaxy: { icon: '🌌', color: '#341f97', size: 'xl', sound: true },
};

const SIZE_CLASSES = {
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

export const GiftAnimation = ({ gifts, onGiftComplete }: GiftAnimationProps) => {
  const [activeGifts, setActiveGifts] = useState<Gift[]>([]);

  useEffect(() => {
    if (gifts.length > 0) {
      setActiveGifts(gifts.slice(-5)); // Show max 5 gifts at once
    }
  }, [gifts]);

  const handleAnimationComplete = (giftId: string) => {
    setActiveGifts(prev => prev.filter(g => g.id !== giftId));
    onGiftComplete?.(giftId);
  };

  return (
    <div className="fixed left-4 top-1/3 z-40 pointer-events-none space-y-3">
      <AnimatePresence mode="popLayout">
        {activeGifts.map((gift, index) => {
          const config = GIFT_CONFIG[gift.giftType] || GIFT_CONFIG.heart;
          
          return (
            <motion.div
              key={gift.id}
              initial={{ x: -200, opacity: 0, scale: 0.5 }}
              animate={{ 
                x: 0, 
                opacity: 1, 
                scale: 1,
              }}
              exit={{ 
                x: 200, 
                opacity: 0, 
                scale: 0.8,
                transition: { duration: 0.3 }
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 25,
                delay: index * 0.1
              }}
              onAnimationComplete={() => {
                setTimeout(() => handleAnimationComplete(gift.id), 2500);
              }}
              className="flex items-center gap-3"
            >
              {/* Gift Card */}
              <motion.div 
                className="flex items-center gap-3 bg-black/60 backdrop-blur-xl rounded-full pl-1 pr-4 py-1 border border-white/10"
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${config.color}00`,
                    `0 0 20px 5px ${config.color}40`,
                    `0 0 0 0 ${config.color}00`,
                  ],
                }}
                transition={{ duration: 1.5, repeat: 1 }}
              >
                <Avatar className="w-10 h-10 border-2" style={{ borderColor: config.color }}>
                  <AvatarImage src={gift.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-sm">
                    {gift.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col">
                  <span className="text-white text-sm font-bold">{gift.username}</span>
                  <div className="flex items-center gap-1">
                    <span className={SIZE_CLASSES[config.size]}>{config.icon}</span>
                    {gift.amount > 1 && (
                      <motion.span 
                        className="text-yellow-400 font-bold text-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ delay: 0.3 }}
                      >
                        x{gift.amount}
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Floating Gift Icon (for large gifts) */}
              {(config.size === 'lg' || config.size === 'xl') && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: [0, 1.5, 1],
                    rotate: [0, 360],
                    y: [0, -20, 0]
                  }}
                  transition={{ 
                    duration: 0.8,
                    times: [0, 0.6, 1]
                  }}
                  className={`${config.size === 'xl' ? 'text-7xl' : 'text-5xl'} absolute -right-16`}
                >
                  {config.icon}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
