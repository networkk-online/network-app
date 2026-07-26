import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Coins, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Quest {
  id: string;
  title_ar: string | null;
  title: string;
  metric: string;
  target_value: number;
  reward_coins: number;
}

interface Progress {
  quest_id: string;
  progress: number;
  is_completed: boolean;
}

interface Props {
  streamId: string | null;
  hostId: string | null;
  isHost: boolean;
  /** Live counters that drive progress. */
  counters?: { likes?: number; roses?: number; followers?: number; diamonds?: number; shares?: number; comments?: number; gifts?: number; duration_minutes?: number };
}

export const LiveQuestPanel = ({ streamId, hostId, isHost, counters = {} }: Props) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [open, setOpen] = useState(true);

  // Fetch quest templates
  useEffect(() => {
    supabase
      .from('live_quests')
      .select('id,title,title_ar,metric,target_value,reward_coins')
      .eq('is_active', true)
      .order('sort_order')
      .limit(3)
      .then(({ data }) => data && setQuests(data as Quest[]));
  }, []);

  // Load existing progress for the stream
  useEffect(() => {
    if (!streamId) return;
    supabase
      .from('live_quest_progress')
      .select('quest_id,progress,is_completed')
      .eq('stream_id', streamId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, Progress> = {};
        data.forEach((r) => { map[r.quest_id] = r as Progress; });
        setProgress(map);
      });

    const ch = supabase
      .channel(`quest-progress-${streamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_quest_progress', filter: `stream_id=eq.${streamId}` },
        (payload) => {
          const row = (payload.new || payload.old) as Progress;
          if (!row) return;
          setProgress((prev) => ({ ...prev, [row.quest_id]: row }));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [streamId]);

  // Host writes progress derived from counters
  useEffect(() => {
    if (!isHost || !streamId || !hostId || quests.length === 0) return;
    const key = (m: string) => (counters as any)[m] ?? 0;
    const rows = quests.map((q) => ({
      stream_id: streamId,
      host_id: hostId,
      quest_id: q.id,
      progress: Math.min(key(q.metric), q.target_value),
      is_completed: key(q.metric) >= q.target_value,
      completed_at: key(q.metric) >= q.target_value ? new Date().toISOString() : null,
    }));
    supabase.from('live_quest_progress').upsert(rows, { onConflict: 'stream_id,quest_id' }).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, streamId, hostId, quests, JSON.stringify(counters)]);

  if (!streamId || quests.length === 0) return null;

  return (
    <div className="absolute top-24 left-3 z-30 pointer-events-auto max-w-[220px]">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-amber-400/40 text-amber-300 text-xs font-black shadow-[0_0_10px_rgba(251,191,36,0.3)]"
      >
        <Trophy className="w-3.5 h-3.5" />
        المهام
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 p-2.5 space-y-2"
          >
            {quests.map((q) => {
              const p = progress[q.id];
              const val = p?.progress ?? 0;
              const done = p?.is_completed;
              const pct = Math.min(100, Math.round((val / q.target_value) * 100));
              return (
                <div key={q.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-white/90 font-semibold truncate">
                      {q.title_ar || q.title}
                    </span>
                    {done ? (
                      <Check className="w-3 h-3 text-[#19e05b] shrink-0" />
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-300 shrink-0">
                        <Coins className="w-2.5 h-2.5" />
                        {q.reward_coins}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        done ? 'bg-[#19e05b]' : 'bg-gradient-to-r from-amber-400 to-amber-500',
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <div className="text-[9px] text-white/40 font-mono text-right">
                    {val} / {q.target_value}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
