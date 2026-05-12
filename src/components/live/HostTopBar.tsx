import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Coins } from 'lucide-react';

interface Props {
  startedAt: number;
  gemsCollected: number;
  beautyOn: boolean;
  onToggleBeauty: () => void;
  viewerCount: number;
}

const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
};

const fmtNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toString();
};

export const HostTopBar = ({ startedAt, gemsCollected, beautyOn, onToggleBeauty, viewerCount }: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
      {/* LIVE pulse */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
        <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]" />
        <span className="text-[#39FF14] text-[11px] font-black tracking-wider">LIVE</span>
        <span className="text-white/80 text-[11px] font-mono ml-1">{fmtTime(now - startedAt)}</span>
      </div>

      {/* Viewer count */}
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        <span className="text-white text-[11px] font-bold">{fmtNum(viewerCount)}</span>
      </div>

      {/* Gems collected */}
      <motion.div
        key={gemsCollected}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#39FF14]/15 backdrop-blur-xl border border-[#39FF14]/40"
      >
        <Coins className="w-3.5 h-3.5 text-[#39FF14]" />
        <span className="text-[#39FF14] text-[11px] font-black">{fmtNum(gemsCollected)}</span>
      </motion.div>

      {/* Beauty toggle */}
      <button
        onClick={onToggleBeauty}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-xl border transition ${
          beautyOn
            ? 'bg-[#39FF14]/20 border-[#39FF14]/60 text-[#39FF14]'
            : 'bg-black/60 border-white/10 text-white/70'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold">جمال</span>
      </button>
    </div>
  );
};

export const beautyFilterStyle: React.CSSProperties = {
  filter: 'contrast(1.05) saturate(1.15) brightness(1.08) blur(0.4px)',
};
