import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  title: string;
  target_count: number;
  current_count: number;
  reward_coins: number;
  is_completed: boolean;
}

interface Props {
  streamId: string | null;
}

/** Floating live goal card. Host-created goal for the stream. */
export const LiveGoalCard = ({ streamId }: Props) => {
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!streamId) return;
    let cancelled = false;
    const fetchGoal = () =>
      supabase
        .from('live_goals')
        .select('id,title,target_count,current_count,reward_coins,is_completed')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => !cancelled && setGoal(data as Goal | null));
    fetchGoal();

    const ch = supabase
      .channel(`live-goal-${streamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_goals', filter: `stream_id=eq.${streamId}` },
        () => fetchGoal(),
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [streamId]);

  if (!goal) return null;
  const pct = Math.min(100, Math.round((goal.current_count / Math.max(1, goal.target_count)) * 100));

  return (
    <AnimatePresence>
      <motion.div
        key={goal.id}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="absolute top-24 right-3 z-30 w-52 rounded-2xl bg-black/70 backdrop-blur-xl border border-fuchsia-500/40 p-3 shadow-[0_0_20px_rgba(217,70,239,0.25)]"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-fuchsia-300" />
          </div>
          <span className="text-white text-xs font-bold truncate">{goal.title}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-1.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/60 font-mono">{goal.current_count} / {goal.target_count}</span>
          <span className="flex items-center gap-0.5 text-fuchsia-300 font-black">
            <Coins className="w-2.5 h-2.5" />
            {goal.reward_coins}
          </span>
        </div>
        {goal.is_completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-2 text-center text-[10px] font-black text-[#19e05b]"
          >
            ✨ اكتمل الهدف!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
