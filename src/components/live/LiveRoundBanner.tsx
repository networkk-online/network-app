import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Round {
  id: string;
  round_number: number;
  round_name: string;
}

interface Props {
  streamId: string | null;
}

const ROUND_META: Record<number, { emoji: string; grad: string }> = {
  1: { emoji: '🔥', grad: 'from-orange-500 to-amber-500' },
  2: { emoji: '❤️', grad: 'from-red-500 to-pink-500' },
  3: { emoji: '🎁', grad: 'from-fuchsia-500 to-purple-500' },
  4: { emoji: '⭐', grad: 'from-yellow-400 to-amber-500' },
  5: { emoji: '👑', grad: 'from-[#19e05b] to-emerald-600' },
};

/** Announces the current round with a full-width animated banner for 3.5s. */
export const LiveRoundBanner = ({ streamId }: Props) => {
  const [round, setRound] = useState<Round | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!streamId) return;
    const ch = supabase
      .channel(`live-round-${streamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_rounds', filter: `stream_id=eq.${streamId}` },
        (payload) => {
          const r = (payload.new || payload.old) as Round;
          if (!r) return;
          setRound(r);
          setVisible(true);
          setTimeout(() => setVisible(false), 3500);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [streamId]);

  return (
    <AnimatePresence>
      {visible && round && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${ROUND_META[round.round_number]?.grad || 'from-[#19e05b] to-emerald-600'} shadow-2xl flex items-center gap-3`}>
            <span className="text-2xl">{ROUND_META[round.round_number]?.emoji || '🎯'}</span>
            <div className="text-black">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Round {round.round_number}</div>
              <div className="text-sm font-black leading-tight">{round.round_name}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
