import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type GrandGiftType = 'lion' | 'whale' | 'supercar' | 'falcon';

export interface GrandGift {
  id: string;
  senderName: string;
  senderAvatar?: string;
  giftType: GrandGiftType;
}

interface GrandGiftAnimationProps {
  gifts: GrandGift[];
  onGiftComplete?: (giftId: string) => void;
}

const GIFT_NAMES: Record<GrandGiftType, string> = {
  lion: 'THE LION 🦁',
  whale: 'THE WHALE 🐋',
  supercar: 'THE SUPERCAR 🏎️',
  falcon: 'THE FALCON 🦅',
};


const playGiftSound = (giftType: GrandGiftType) => {
  // Placeholder for sound integration
  // lion -> Roar, whale -> Splash, supercar -> Engine Rev
  console.log(`[Sound] Playing ${giftType} sound`);
};

// ─── Particle System ───
const Particles = ({ color, count, spread }: { color: string; count: number; spread: 'burst' | 'splash' }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const angle = spread === 'burst'
        ? (Math.random() * 360) * (Math.PI / 180)
        : (Math.random() * Math.PI - Math.PI);
      const dist = 60 + Math.random() * 120;
      const x = Math.cos(angle) * dist;
      const y = spread === 'splash' ? -(Math.random() * 100 + 30) : Math.sin(angle) * dist;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x, y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.8 + Math.random() * 0.6, delay: Math.random() * 0.2 }}
        />
      );
    })}
  </>
);

// ─── Lion Animation ───
const LionAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowParticles(true), 600);
    const t2 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
      />
      {/* Shake wrapper */}
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, -4, 4, -3, 3, 0] }}
        transition={{ duration: 0.6, delay: 0.5, repeat: 1 }}
      >
        {/* Lion */}
        <motion.div
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1.1], rotate: [0, 5, 0], opacity: 1 }}
          transition={{ duration: 0.8, times: [0, 0.6, 1], type: 'spring' }}
          className="relative"
        >
          <span className="text-[120px] drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]">🦁</span>
          {/* Golden ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '3px solid #ffd700', boxShadow: '0 0 40px #ffd700, inset 0 0 30px #ffd70050' }}
            animate={{ scale: [0.8, 1.6], opacity: [0.8, 0] }}
            transition={{ duration: 1, repeat: 2 }}
          />
        </motion.div>
        {/* Mouth particles */}
        {showParticles && (
          <div className="absolute" style={{ top: '55%', left: '50%' }}>
            <Particles color="#ffd700" count={30} spread="burst" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Whale Animation ───
const WhaleAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSplash(true), 1200);
    const t2 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* Whale arc */}
      <motion.div
        initial={{ left: '-15%', bottom: '-10%', rotate: 30 }}
        animate={{ left: '85%', bottom: '65%', rotate: -20 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute"
        style={{ fontSize: 100 }}
      >
        <span className="drop-shadow-[0_0_30px_rgba(0,200,255,0.5)]">🐋</span>
      </motion.div>
      {/* Splash */}
      {showSplash && (
        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2">
          <Particles color="#00d4ff" count={40} spread="splash" />
          <motion.div
            className="absolute w-[300px] h-[60px] rounded-[50%] -translate-x-1/2"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,212,255,0.4), transparent)',
              boxShadow: '0 0 40px rgba(0,212,255,0.3)',
            }}
            initial={{ scaleX: 0.3, opacity: 0 }}
            animate={{ scaleX: [0.3, 1.5, 1], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.2 }}
          />
        </div>
      )}
    </motion.div>
  );
};

// ─── Supercar Animation ───
const SupercarAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* Car */}
      <motion.div
        initial={{ right: '-20%', bottom: '12%' }}
        animate={{ right: '110%' }}
        transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        className="absolute flex items-end"
      >
        <span className="text-[90px] drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]" style={{ filter: 'blur(0.5px)' }}>
          🏎️
        </span>
        {/* Motion blur trail */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2 h-2"
          style={{
            width: 200,
            background: 'linear-gradient(to left, #ffd700, #ff8c00, transparent)',
            filter: 'blur(3px)',
            borderRadius: 4,
          }}
          animate={{ opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 0.2, repeat: Infinity }}
        />
      </motion.div>
      {/* Tire marks */}
      <motion.div
        className="absolute bottom-[10%] left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(to right, transparent 10%, #ffd70060 30%, #ff8c0060 60%, transparent 90%)',
          filter: 'blur(1px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 2.5 }}
      />
    </motion.div>
  );
};

// ─── User Recognition Banner ───
const RecognitionBanner = ({ senderName, giftType }: { senderName: string; giftType: GrandGiftType }) => (
  <motion.div
    className="fixed top-16 left-1/2 -translate-x-1/2 z-[101] pointer-events-none"
    initial={{ y: -60, opacity: 0, scale: 0.8 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    exit={{ y: -40, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <div
      className="px-6 py-3 rounded-2xl text-center whitespace-nowrap"
      style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.15))',
        border: '1px solid rgba(255,215,0,0.4)',
        boxShadow: '0 0 30px rgba(255,215,0,0.25), 0 0 60px rgba(255,215,0,0.1)',
      }}
    >
      <p
        className="text-lg font-black uppercase tracking-wider"
        style={{
          background: 'linear-gradient(135deg, #ffd700, #ffaa00, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255,215,0,0.3)',
          filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.4))',
        }}
      >
        {senderName} SENT {GIFT_NAMES[giftType]}
      </p>
    </div>
  </motion.div>
);

// ─── Main Engine ───
export const GrandGiftAnimationEngine = ({ gifts, onGiftComplete }: GrandGiftAnimationProps) => {
  const [queue, setQueue] = useState<GrandGift[]>([]);
  const [current, setCurrent] = useState<GrandGift | null>(null);
  const isPlayingRef = useRef(false);

  // Enqueue new gifts
  useEffect(() => {
    if (gifts.length > 0) {
      setQueue(prev => [...prev, ...gifts.filter(g => !prev.find(q => q.id === g.id) && current?.id !== g.id)]);
    }
  }, [gifts]);

  // Play next in queue
  useEffect(() => {
    if (!isPlayingRef.current && queue.length > 0 && !current) {
      isPlayingRef.current = true;
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrent(next);
      playGiftSound(next.giftType);
    }
  }, [queue, current]);

  const handleComplete = useCallback(() => {
    if (current) {
      onGiftComplete?.(current.id);
      setCurrent(null);
      isPlayingRef.current = false;
    }
  }, [current, onGiftComplete]);

  return (
    <AnimatePresence>
      {current && (
        <>
          <RecognitionBanner senderName={current.senderName} giftType={current.giftType} />
          {current.giftType === 'lion' && <LionAnimation onComplete={handleComplete} />}
          {current.giftType === 'whale' && <WhaleAnimation onComplete={handleComplete} />}
          {current.giftType === 'supercar' && <SupercarAnimation onComplete={handleComplete} />}
        </>
      )}
    </AnimatePresence>
  );
};
