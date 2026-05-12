import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GiftTier = 1 | 2 | 3;

export interface TieredGiftEvent {
  id: string;
  giftId: string;
  icon: string;
  name: string;
  price: number;
  sender: string;
  tier: GiftTier;
}

export const giftTier = (price: number): GiftTier => {
  if (price >= 500) return 3;
  if (price >= 50) return 2;
  return 1;
};

// Lightweight WebAudio "ding" / "power-up" — no asset files required.
const playSound = (tier: GiftTier) => {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    if (tier === 3) {
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      o.start(); o.stop(ctx.currentTime + 0.95);
    } else if (tier === 2) {
      o.type = 'triangle';
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.25);
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.45);
    } else {
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.start(); o.stop(ctx.currentTime + 0.2);
    }
  } catch {/* ignore */}
};

interface Props {
  events: TieredGiftEvent[];
  onComplete: (id: string) => void;
}

export const TieredGiftOverlay = ({ events, onComplete }: Props) => {
  const playedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    events.forEach(ev => {
      if (playedRef.current.has(ev.id)) return;
      playedRef.current.add(ev.id);
      playSound(ev.tier);
      if (navigator.vibrate) navigator.vibrate(ev.tier === 3 ? [80, 40, 120] : ev.tier === 2 ? [40, 20, 40] : [30]);
      const dur = ev.tier === 3 ? 3000 : ev.tier === 2 ? 2000 : 1400;
      setTimeout(() => onComplete(ev.id), dur);
    });
  }, [events, onComplete]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {events.map(ev => {
          if (ev.tier === 1) return <Tier1 key={ev.id} ev={ev} />;
          if (ev.tier === 2) return <Tier2 key={ev.id} ev={ev} />;
          return <Tier3 key={ev.id} ev={ev} />;
        })}
      </AnimatePresence>
    </div>
  );
};

const Tier1 = ({ ev }: { ev: TieredGiftEvent }) => (
  <>
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.05, 1] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      className="absolute inset-0 ring-4 ring-[#39FF14]/60 shadow-[inset_0_0_60px_#39FF14] rounded-2xl"
    />
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.6 }}
      animate={{ y: -120, opacity: [0, 1, 0], scale: [0.6, 1.4, 1.2] }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 text-6xl drop-shadow-[0_0_20px_#39FF14]"
    >
      {ev.icon}
    </motion.div>
  </>
);

const Tier2 = ({ ev }: { ev: TieredGiftEvent }) => {
  const particles = Array.from({ length: 24 });
  return (
    <>
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -40, x: `${(i / particles.length) * 100}%`, opacity: 0, rotate: 0 }}
          animate={{ y: '100vh', opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 1.8 + Math.random() * 0.6, delay: i * 0.04, ease: 'easeIn' }}
          className="absolute top-0 text-2xl drop-shadow-[0_0_8px_#39FF14]"
        >
          {ev.icon}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.6, 1.4] }}
        transition={{ duration: 2 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 text-7xl drop-shadow-[0_0_30px_#39FF14]"
      >
        {ev.icon}
      </motion.div>
    </>
  );
};

const Tier3 = ({ ev }: { ev: TieredGiftEvent }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.5, 0.3, 0] }}
      transition={{ duration: 3 }}
      className="absolute inset-0 bg-gradient-radial from-[#39FF14]/25 via-black/40 to-black/80"
    />
    <motion.div
      initial={{ y: '110vh', x: '-50%', opacity: 0, rotate: -8, scale: 0.6 }}
      animate={{
        y: ['110vh', '20vh', '-30vh'],
        opacity: [0, 1, 1, 0],
        rotate: [-8, 0, 6],
        scale: [0.6, 1.6, 1.2],
      }}
      transition={{ duration: 3, ease: [0.4, 0.05, 0.2, 1] }}
      className="absolute bottom-0 left-1/2 text-[120px] drop-shadow-[0_0_60px_#39FF14]"
      style={{ filter: 'drop-shadow(0 0 30px #39FF14)' }}
    >
      {ev.icon}
    </motion.div>
    {/* exhaust trail */}
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: '110vh', x: `${48 + (Math.random() * 4)}%`, opacity: 0, scale: 0.4 }}
        animate={{ y: '-10vh', opacity: [0, 0.9, 0], scale: [0.4, 1.5, 2] }}
        transition={{ duration: 2.4 + Math.random() * 0.4, delay: 0.2 + i * 0.05 }}
        className="absolute w-3 h-3 rounded-full bg-[#39FF14] blur-md"
      />
    ))}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
      transition={{ duration: 3 }}
      className="absolute top-1/4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-[#39FF14]/60 shadow-[0_0_40px_#39FF14]"
    >
      <p className="text-[#39FF14] font-black text-2xl tracking-wider">{ev.sender}</p>
      <p className="text-white text-sm text-center">أرسل {ev.name} 🎉</p>
    </motion.div>
  </>
);
