import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

export interface CinematicGift {
  id: string;
  giftId: string;
  emoji: string;
  name: string;
  senderName: string;
  tier: 'basic' | 'premium' | 'super' | 'legendary';
}

/** Full-screen premium 3D-style gift entry animation. FIFO queue. */
export const CinematicGiftLayer = ({
  queue,
  onComplete,
}: {
  queue: CinematicGift[];
  onComplete: (id: string) => void;
}) => {
  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => onComplete(current.id), current.tier === 'legendary' ? 5000 : 3500);
    return () => clearTimeout(t);
  }, [current?.id]);

  if (!current) return null;

  const isLegendary = current.tier === 'legendary';
  const bg = isLegendary
    ? 'var(--gradient-legendary)'
    : current.tier === 'super'
    ? 'var(--gradient-vip)'
    : 'var(--gradient-emerald)';

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
      >
        {/* Radial burst */}
        <motion.div
          initial={{ scale: 0, opacity: 0.9 }}
          animate={{ scale: 6, opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute w-64 h-64 rounded-full blur-3xl"
          style={{ background: bg }}
        />
        {/* Emoji stage */}
        <motion.div
          initial={{ scale: 0.2, y: 100, rotate: -20, opacity: 0 }}
          animate={{ scale: [0.2, 1.4, 1.1], y: [100, -20, 0], rotate: [−20, 8, 0] as any, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.2, 0.9, 0.3, 1] }}
          className="relative text-[180px] drop-shadow-[0_0_60px_hsl(var(--vip-gold-glow)/0.9)]"
        >
          {current.emoji}
        </motion.div>
        {/* Sender banner */}
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute bottom-24 px-6 py-3 rounded-full backdrop-blur-xl border"
          style={{
            background: 'rgba(0,0,0,0.55)',
            borderColor: isLegendary ? 'hsl(var(--vip-gold) / 0.6)' : 'hsl(var(--live-emerald) / 0.5)',
          }}
        >
          <div className="text-xs uppercase tracking-[0.3em] text-white/60">
            {isLegendary ? 'LEGENDARY GIFT' : current.tier.toUpperCase()}
          </div>
          <div className="text-base font-bold text-white text-center">
            <span style={{ color: 'hsl(var(--vip-gold))' }}>{current.senderName}</span>
            <span className="mx-2 text-white/50">أهدى</span>
            <span>{current.name}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/** VIP entrance banner slide-in from left, gold rim. */
export interface VIPEntrance {
  id: string;
  username: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legend';
  avatarUrl?: string;
}
export const VIPEntranceLayer = ({
  queue,
  onComplete,
}: {
  queue: VIPEntrance[];
  onComplete: (id: string) => void;
}) => {
  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => onComplete(current.id), 2800);
    return () => clearTimeout(t);
  }, [current?.id]);
  if (!current) return null;
  const tierColor: Record<string, string> = {
    bronze: 'hsl(30 60% 50%)',
    silver: 'hsl(0 0% 75%)',
    gold: 'hsl(var(--vip-gold))',
    diamond: 'hsl(190 90% 65%)',
    legend: 'hsl(280 90% 60%)',
  };
  return (
    <motion.div
      key={current.id}
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="absolute top-24 left-0 z-40 pointer-events-none px-4 py-2 rounded-r-full backdrop-blur-xl border-y border-r"
      style={{
        background: 'linear-gradient(90deg, rgba(0,0,0,0.7), rgba(0,0,0,0.2))',
        borderColor: `${tierColor[current.tier]} / 0.6`,
        boxShadow: `0 0 30px ${tierColor[current.tier]}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">👑</span>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: tierColor[current.tier] }}>
            {current.tier} VIP
          </span>
          <span className="text-sm font-bold text-white">{current.username} انضم</span>
        </div>
      </div>
    </motion.div>
  );
};

/** Combo counter that scales/bumps on rapid repeated gifts. */
export const ComboBanner = ({ count, giftEmoji }: { count: number; giftEmoji: string }) => {
  if (count < 2) return null;
  return (
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="absolute right-20 bottom-40 z-30 pointer-events-none"
    >
      <div
        className="relative flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border"
        style={{
          background: 'rgba(0,0,0,0.55)',
          borderColor: 'hsl(var(--vip-gold) / 0.6)',
          boxShadow: '0 0 25px hsl(var(--vip-gold) / 0.5)',
        }}
      >
        <span className="text-3xl">{giftEmoji}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-white/60 uppercase tracking-widest">Combo</span>
          <span className="text-2xl font-black" style={{ color: 'hsl(var(--vip-gold))' }}>
            x{count}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/** Continuous flying hearts from bottom-right. Fires when a like is tapped. */
export const FlyingHeartsLayer = ({ pulseKey }: { pulseKey: number }) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; hue: number }[]>([]);
  useEffect(() => {
    if (pulseKey === 0) return;
    const id = Date.now() + Math.random();
    const x = Math.random() * 40 - 20;
    const hue = 140 + Math.random() * 60;
    setHearts((h) => [...h, { id, x, hue }]);
    const t = setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 2500);
    return () => clearTimeout(t);
  }, [pulseKey]);
  return (
    <div className="absolute right-8 bottom-32 z-20 pointer-events-none">
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ y: 0, x: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -280, x: h.x, opacity: 0, scale: 1.2 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
            className="absolute"
          >
            <Heart
              className="w-8 h-8"
              fill={`hsl(${h.hue} 90% 60%)`}
              stroke={`hsl(${h.hue} 90% 60%)`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
