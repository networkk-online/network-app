import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FlyingHeart {
  id: string;
  x: number;
  color: string;
  size: number;
  duration: number;
}

interface FlyingHeartsProps {
  onTap?: () => void;
}

const HEART_COLORS = ['#ff4757', '#ff6b81', '#ff9ff3', '#feca57', '#ff6b6b', '#fd79a8', '#e84393'];

export const FlyingHearts = ({ onTap }: FlyingHeartsProps) => {
  const [hearts, setHearts] = useState<FlyingHeart[]>([]);

  const addHeart = useCallback(() => {
    const newHeart: FlyingHeart = {
      id: `${Date.now()}-${Math.random()}`,
      x: Math.random() * 60 + 20, // 20-80%
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      size: Math.random() * 12 + 20, // 20-32px
      duration: Math.random() * 1 + 2.5, // 2.5-3.5s
    };
    
    setHearts(prev => [...prev, newHeart]);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    onTap?.();
    
    // Remove after animation
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, newHeart.duration * 1000 + 500);
  }, [onTap]);

  // Create burst of hearts
  const addHeartBurst = useCallback(() => {
    const burstCount = 5;
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => addHeart(), i * 50);
    }
    if (navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  }, [addHeart]);

  return (
    <>
      {/* Tap area */}
      <motion.div
        className="absolute bottom-32 right-4 w-16 h-16 z-30 cursor-pointer"
        whileTap={{ scale: 0.9 }}
        onClick={addHeart}
        onDoubleClick={addHeartBurst}
      >
        <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <Heart className="w-7 h-7 text-pink-500 fill-pink-500" />
        </div>
      </motion.div>

      {/* Flying hearts container */}
      <div className="fixed bottom-0 right-0 w-32 h-[70vh] pointer-events-none z-20">
        <AnimatePresence>
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ 
                x: `${heart.x}%`,
                y: '100%',
                opacity: 1,
                scale: 0.3,
                rotate: Math.random() * 30 - 15
              }}
              animate={{ 
                y: '0%',
                opacity: [1, 1, 0.8, 0],
                scale: [0.3, 1.2, 1, 0.8],
                x: [
                  `${heart.x}%`,
                  `${heart.x + (Math.random() - 0.5) * 40}%`,
                  `${heart.x + (Math.random() - 0.5) * 60}%`,
                ],
                rotate: [0, -20, 20, 0]
              }}
              transition={{ 
                duration: heart.duration,
                ease: 'easeOut',
                times: [0, 0.3, 0.7, 1]
              }}
              className="absolute"
              style={{ 
                color: heart.color,
                fontSize: heart.size,
              }}
            >
              <Heart className="fill-current" style={{ width: heart.size, height: heart.size }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
