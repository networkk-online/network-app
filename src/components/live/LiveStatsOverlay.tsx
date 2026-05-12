import { motion } from 'framer-motion';
import { Activity, Wifi, Gauge } from 'lucide-react';
import type { AgoraStats } from '@/hooks/useAgoraRoom';

interface Props {
  stats: AgoraStats;
}

export const LiveStatsOverlay = ({ stats }: Props) => {
  const lossColor =
    stats.packetLoss >= 5 ? 'text-red-400' : stats.packetLoss >= 1 ? 'text-yellow-300' : 'text-[#39FF14]';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 right-4 z-40 px-3 py-2 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(57,255,20,0.15)]"
    >
      <div className="flex items-center gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-[#39FF14]">
          <Activity className="w-3.5 h-3.5" />
          <span>{stats.bitrateKbps} kbps</span>
        </div>
        <div className="w-px h-3 bg-white/15" />
        <div className="flex items-center gap-1.5 text-white/90">
          <Gauge className="w-3.5 h-3.5" />
          <span>{stats.fps} fps</span>
        </div>
        <div className="w-px h-3 bg-white/15" />
        <div className={`flex items-center gap-1.5 ${lossColor}`}>
          <Wifi className="w-3.5 h-3.5" />
          <span>{stats.packetLoss}%</span>
        </div>
        {stats.rtt > 0 && (
          <>
            <div className="w-px h-3 bg-white/15" />
            <span className="text-white/60">{stats.rtt}ms</span>
          </>
        )}
      </div>
    </motion.div>
  );
};
