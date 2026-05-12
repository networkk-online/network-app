import { motion } from 'framer-motion';
import { Swords, X } from 'lucide-react';
import type { AgoraParticipant } from '@/hooks/useAgoraRoom';
import { useEffect, useRef } from 'react';

interface Props {
  participants: AgoraParticipant[];
  onExit: () => void;
}

/**
 * VS Mode — splits viewport 50/50 vertically with a neon divider.
 * Renders the local host on the left, the first remote (guest) on the right.
 */
export const VSModeFrame = ({ participants, onExit }: Props) => {
  const local = participants.find(p => p.isLocal);
  const guest = participants.find(p => !p.isLocal);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (local?.videoTrack && leftRef.current) {
      try { local.videoTrack.play(leftRef.current); } catch {/* */}
    }
    if (guest?.videoTrack && rightRef.current) {
      try { guest.videoTrack.play(rightRef.current); } catch {/* */}
    }
  }, [local, guest]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 bg-black flex"
    >
      <div ref={leftRef} className="flex-1 relative bg-black overflow-hidden">
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-[#39FF14]/40 text-[#39FF14] text-[10px] font-black tracking-widest">
          المضيف
        </div>
      </div>

      {/* Neon divider */}
      <div className="w-[3px] bg-[#39FF14] shadow-[0_0_20px_#39FF14] relative">
        <motion.div
          animate={{ scaleY: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-[#39FF14]"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black border-2 border-[#39FF14] flex items-center justify-center shadow-[0_0_20px_#39FF14]">
          <Swords className="w-5 h-5 text-[#39FF14]" />
        </div>
      </div>

      <div ref={rightRef} className="flex-1 relative bg-gradient-to-br from-[#0a0a0a] to-[#0d1a0f] overflow-hidden">
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-[#39FF14]/40 text-[#39FF14] text-[10px] font-black tracking-widest">
          الضيف
        </div>
        {!guest && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40 text-sm">بانتظار انضمام الضيف...</p>
          </div>
        )}
      </div>

      <button
        onClick={onExit}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
