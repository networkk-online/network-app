import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Entrance {
  id: string;
  viewer_id: string;
  vip_tier: string;
  username?: string;
  avatar_url?: string;
}

interface Props {
  streamId: string | null;
}

const TIER_META: Record<string, { label: string; grad: string; emoji: string }> = {
  bronze:   { label: 'Bronze',   grad: 'from-amber-700 to-orange-600',      emoji: '🥉' },
  silver:   { label: 'Silver',   grad: 'from-slate-400 to-slate-500',       emoji: '🥈' },
  gold:     { label: 'Gold',     grad: 'from-yellow-400 to-amber-500',      emoji: '🥇' },
  platinum: { label: 'Platinum', grad: 'from-cyan-300 to-teal-500',         emoji: '💠' },
  diamond:  { label: 'Diamond',  grad: 'from-blue-400 to-indigo-500',       emoji: '💎' },
  royal:    { label: 'Royal',    grad: 'from-fuchsia-500 to-purple-600',    emoji: '👑' },
  legend:   { label: 'Legend',   grad: 'from-[#19e05b] to-emerald-600',     emoji: '🐉' },
};

/** FIFO queue of VIP entrance banners driven by realtime broadcast events. */
export const VIPEntranceEffect = ({ streamId }: Props) => {
  const [queue, setQueue] = useState<Entrance[]>([]);
  const [current, setCurrent] = useState<Entrance | null>(null);

  useEffect(() => {
    if (!streamId) return;
    const ch = supabase
      .channel(`entrance-${streamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_entrance_events', filter: `stream_id=eq.${streamId}` },
        async (payload) => {
          const row = payload.new as any;
          if (!row?.vip_tier || row.vip_tier === 'none') return;
          const { data: prof } = await supabase
            .from('profiles_public')
            .select('username,avatar_url')
            .eq('id', row.viewer_id)
            .maybeSingle();
          setQueue((q) => [...q, {
            id: row.id, viewer_id: row.viewer_id, vip_tier: row.vip_tier,
            username: prof?.username, avatar_url: prof?.avatar_url ?? undefined,
          }]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [streamId]);

  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue((q) => q.slice(1));
    setCurrent(next);
    const t = setTimeout(() => setCurrent(null), 4200);
    return () => clearTimeout(t);
  }, [queue, current]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 22 }}
          className="absolute top-1/3 left-0 right-0 z-40 pointer-events-none flex justify-center"
        >
          <div className={`px-5 py-2.5 rounded-full bg-gradient-to-r ${TIER_META[current.vip_tier]?.grad || TIER_META.bronze.grad} shadow-2xl flex items-center gap-3`}>
            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-lg">
              {TIER_META[current.vip_tier]?.emoji}
            </div>
            <div className="text-white">
              <div className="text-[9px] font-black tracking-widest uppercase opacity-80">
                {TIER_META[current.vip_tier]?.label} VIP
              </div>
              <div className="text-sm font-black leading-tight flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {current.username || 'ضيف مميز'} انضم للبث
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
