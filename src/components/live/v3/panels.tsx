import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, Target, Swords, Gift, Shield, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Shared sheet chrome. */
const Sheet = ({
  open,
  onClose,
  title,
  icon,
  children,
  accent = 'emerald',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: 'emerald' | 'gold' | 'violet';
}) => {
  const accentBorder =
    accent === 'gold'
      ? 'hsl(var(--vip-gold) / 0.5)'
      : accent === 'violet'
      ? 'hsl(280 90% 60% / 0.5)'
      : 'hsl(var(--live-emerald) / 0.5)';
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[70vh] rounded-t-3xl border-t overflow-hidden flex flex-col"
            style={{ background: 'rgba(0,0,0,0.95)', borderColor: accentBorder }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                {icon}
                <span className="font-bold text-white">{title}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-full">
                <X className="w-4 h-4 text-white/70" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════ MISSIONS ═══════════════
export const MissionsSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: m } = await supabase
        .from('live_missions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setMissions(m || []);
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: p } = await supabase
          .from('live_mission_progress')
          .select('mission_id, progress')
          .eq('user_id', userData.user.id);
        const map: Record<string, number> = {};
        (p || []).forEach((row: any) => (map[row.mission_id] = row.progress));
        setProgress(map);
      }
    })();
  }, [open]);

  const grouped = { daily: [] as any[], weekly: [] as any[], monthly: [] as any[] };
  missions.forEach((m) => grouped[m.kind as keyof typeof grouped]?.push(m));

  return (
    <Sheet open={open} onClose={onClose} title="المهام" icon={<Target className="w-5 h-5 text-emerald-400" />}>
      {(['daily', 'weekly', 'monthly'] as const).map((k) => (
        <div key={k} className="mb-6">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
            {k === 'daily' ? 'يومي' : k === 'weekly' ? 'أسبوعي' : 'شهري'}
          </div>
          <div className="space-y-2">
            {grouped[k].map((m) => {
              const pct = Math.min(100, ((progress[m.id] || 0) / m.requirement_target) * 100);
              const done = pct >= 100;
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl border flex items-center gap-3"
                  style={{
                    background: done ? 'hsl(var(--live-emerald) / 0.08)' : 'rgba(255,255,255,0.03)',
                    borderColor: done ? 'hsl(var(--live-emerald) / 0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="text-2xl">{m.icon || '⭐'}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{m.title_ar || m.title}</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'var(--gradient-emerald)' }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-white/50">
                      {progress[m.id] || 0}/{m.requirement_target}
                    </div>
                  </div>
                  <div
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: 'hsl(var(--vip-gold) / 0.15)',
                      color: 'hsl(var(--vip-gold))',
                    }}
                  >
                    +{m.reward_coins} 💎
                  </div>
                </div>
              );
            })}
            {grouped[k].length === 0 && <div className="text-xs text-white/30">لا يوجد</div>}
          </div>
        </div>
      ))}
    </Sheet>
  );
};

// ═══════════════ LEADERBOARD ═══════════════
export const LeaderboardSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [kind, setKind] = useState<'gifter' | 'supporter' | 'viewer' | 'fan'>('gifter');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('live_leaderboard_snapshots')
      .select('rank, user_id, score')
      .eq('period', period)
      .eq('kind', kind)
      .order('rank')
      .limit(50)
      .then(({ data }) => setRows(data || []));
  }, [open, period, kind]);

  return (
    <Sheet open={open} onClose={onClose} title="المتصدرون" icon={<Trophy className="w-5 h-5" style={{ color: 'hsl(var(--vip-gold))' }} />} accent="gold">
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {(['gifter', 'supporter', 'viewer', 'fan'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              'shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold border',
              kind === k ? 'bg-white text-black border-white' : 'text-white/60 border-white/10',
            )}
          >
            {k === 'gifter' ? 'مهدون' : k === 'supporter' ? 'داعمون' : k === 'viewer' ? 'مشاهدون' : 'معجبون'}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'shrink-0 text-[11px] px-3 py-1 rounded-full',
              period === p ? 'bg-white/15 text-white' : 'text-white/50',
            )}
          >
            {p === 'daily' ? 'اليوم' : p === 'weekly' ? 'الأسبوع' : p === 'monthly' ? 'الشهر' : 'الكل'}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">لا توجد بيانات بعد</div>
        )}
        {rows.map((r) => (
          <div
            key={`${r.rank}-${r.user_id}`}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-black',
                r.rank === 1 ? 'text-black' : 'text-white/80',
              )}
              style={{
                background:
                  r.rank === 1
                    ? 'var(--gradient-vip)'
                    : r.rank === 2
                    ? 'hsl(0 0% 75%)'
                    : r.rank === 3
                    ? 'hsl(30 60% 50%)'
                    : 'rgba(255,255,255,0.08)',
              }}
            >
              {r.rank}
            </div>
            <div className="flex-1 text-sm text-white/80 truncate">{r.user_id.slice(0, 8)}…</div>
            <div className="text-xs font-bold" style={{ color: 'hsl(var(--vip-gold))' }}>
              {Number(r.score).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
};

// ═══════════════ VIEWERS ═══════════════
export const ViewersSheet = ({
  open,
  onClose,
  viewers,
  isHost,
  onKick,
  onMute,
  onPromoteMod,
}: {
  open: boolean;
  onClose: () => void;
  viewers: { uid: string | number; username: string; isMuted?: boolean }[];
  isHost: boolean;
  onKick?: (uid: string | number) => void;
  onMute?: (uid: string | number) => void;
  onPromoteMod?: (uid: string | number) => void;
}) => (
  <Sheet open={open} onClose={onClose} title={`المشاهدون (${viewers.length})`} icon={<Users className="w-5 h-5 text-emerald-400" />}>
    <div className="space-y-2">
      {viewers.length === 0 && <div className="text-center py-8 text-white/30 text-sm">لا يوجد مشاهدون</div>}
      {viewers.map((v) => (
        <div key={String(v.uid)} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
            {v.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 text-sm text-white truncate">{v.username}</div>
          {isHost && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => onPromoteMod?.(v.uid)}>
                مشرف
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => onMute?.(v.uid)}>
                {v.isMuted ? 'إلغاء الكتم' : 'كتم'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-red-400" onClick={() => onKick?.(v.uid)}>
                طرد
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  </Sheet>
);

// ═══════════════ PK BATTLE ═══════════════
export const PKBattlePanel = ({
  open,
  onClose,
  hostScore,
  opponentScore,
  hostName,
  opponentName,
  timeLeft,
}: {
  open: boolean;
  onClose: () => void;
  hostScore: number;
  opponentScore: number;
  hostName: string;
  opponentName: string;
  timeLeft: number;
}) => {
  const total = Math.max(1, hostScore + opponentScore);
  const hostPct = (hostScore / total) * 100;
  return (
    <Sheet open={open} onClose={onClose} title="معركة PK" icon={<Swords className="w-5 h-5 text-red-400" />} accent="violet">
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-white">
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        <div className="text-xs text-white/50 uppercase tracking-widest mt-1">الوقت المتبقي</div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-white">{hostName}</div>
          <div className="text-2xl font-black" style={{ color: 'hsl(var(--live-emerald))' }}>
            {hostScore.toLocaleString()}
          </div>
        </div>
        <div className="text-2xl">⚔️</div>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-white">{opponentName}</div>
          <div className="text-2xl font-black text-red-400">{opponentScore.toLocaleString()}</div>
        </div>
      </div>
      <div className="h-3 rounded-full bg-red-500/30 overflow-hidden flex">
        <div
          className="h-full transition-all"
          style={{
            width: `${hostPct}%`,
            background: 'var(--gradient-emerald)',
            boxShadow: '0 0 15px hsl(var(--live-emerald) / 0.6)',
          }}
        />
      </div>
    </Sheet>
  );
};

// ═══════════════ GOALS ═══════════════
export const GoalsSheet = ({
  open,
  onClose,
  isHost,
  streamId,
  hostId,
}: {
  open: boolean;
  onClose: () => void;
  isHost: boolean;
  streamId: string | null;
  hostId: string | null;
}) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!open || !streamId) return;
    supabase
      .from('live_goals')
      .select('*')
      .eq('stream_id', streamId)
      .then(({ data }) => setGoals(data || []));
  }, [open, streamId]);

  const createGoal = async () => {
    if (!streamId || !hostId || !target || !title) return;
    await supabase.from('live_goals').insert({
      stream_id: streamId,
      host_id: hostId,
      title,
      target_count: parseInt(target, 10),
      current_count: 0,
    });
    setTitle('');
    setTarget('');
    const { data } = await supabase.from('live_goals').select('*').eq('stream_id', streamId);
    setGoals(data || []);
  };

  return (
    <Sheet open={open} onClose={onClose} title="أهداف البث" icon={<Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--vip-gold))' }} />} accent="gold">
      {isHost && (
        <div className="mb-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الهدف"
            className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white outline-none border border-white/10"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="القيمة المستهدفة (💎)"
            type="number"
            className="w-full bg-black/40 rounded-xl px-3 py-2 text-sm text-white outline-none border border-white/10"
          />
          <Button onClick={createGoal} className="w-full rounded-xl h-9 text-xs" style={{ background: 'var(--gradient-vip)', color: '#000' }}>
            إنشاء هدف
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {goals.map((g) => {
          const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
          return (
            <div key={g.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-sm font-semibold text-white">{g.title}</div>
                <div className="text-[10px] text-white/50">
                  {g.current_amount}/{g.target_amount} 💎
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--gradient-vip)' }} />
              </div>
            </div>
          );
        })}
        {goals.length === 0 && <div className="text-center py-6 text-white/30 text-sm">لا توجد أهداف</div>}
      </div>
    </Sheet>
  );
};

// ═══════════════ MODERATION ═══════════════
export const ModerationSheet = ({
  open,
  onClose,
  streamId,
}: {
  open: boolean;
  onClose: () => void;
  streamId: string | null;
}) => {
  const [mods, setMods] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  useEffect(() => {
    if (!open || !streamId) return;
    supabase.from('live_moderators').select('*').eq('stream_id', streamId).then(({ data }) => setMods(data || []));
    supabase.from('live_bans').select('*').eq('stream_id', streamId).then(({ data }) => setBans(data || []));
  }, [open, streamId]);
  return (
    <Sheet open={open} onClose={onClose} title="الإشراف" icon={<Shield className="w-5 h-5 text-emerald-400" />}>
      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-white/40 mb-2">المشرفون ({mods.length})</div>
        {mods.length === 0 && <div className="text-xs text-white/30">لا يوجد مشرفون بعد. رقّ مشاهدين من قائمة المشاهدين.</div>}
        {mods.map((m) => (
          <div key={m.id} className="text-sm text-white/70 py-1">
            👮 {m.user_id.slice(0, 8)}…
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-white/40 mb-2">المحظورون ({bans.length})</div>
        {bans.length === 0 && <div className="text-xs text-white/30">لا يوجد محظورون.</div>}
        {bans.map((b) => (
          <div key={b.id} className="text-sm text-red-400/80 py-1">
            🚫 {b.user_id.slice(0, 8)}… {b.reason && <span className="text-white/40">({b.reason})</span>}
          </div>
        ))}
      </div>
    </Sheet>
  );
};

// ═══════════════ TREASURE BOX ═══════════════
export const TreasureBoxSheet = ({
  open,
  onClose,
  isHost,
  streamId,
  hostId,
}: {
  open: boolean;
  onClose: () => void;
  isHost: boolean;
  streamId: string | null;
  hostId: string | null;
}) => {
  const [boxes, setBoxes] = useState<any[]>([]);
  useEffect(() => {
    if (!open || !streamId) return;
    supabase.from('live_treasure_box').select('*').eq('stream_id', streamId).order('created_at', { ascending: false }).then(({ data }) => setBoxes(data || []));
  }, [open, streamId]);
  const drop = async (tier: string, reward: number) => {
    if (!streamId || !hostId) return;
    await supabase.from('live_treasure_box').insert({
      stream_id: streamId,
      host_id: hostId,
      tier,
      reward_coins: reward,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    const { data } = await supabase.from('live_treasure_box').select('*').eq('stream_id', streamId).order('created_at', { ascending: false });
    setBoxes(data || []);
  };
  const open_ = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase
      .from('live_treasure_box')
      .update({ opened_by: userData.user.id, opened_at: new Date().toISOString() })
      .eq('id', id)
      .is('opened_by', null);
    const { data } = await supabase.from('live_treasure_box').select('*').eq('stream_id', streamId!).order('created_at', { ascending: false });
    setBoxes(data || []);
  };
  return (
    <Sheet open={open} onClose={onClose} title="صندوق الكنز" icon={<Gift className="w-5 h-5" style={{ color: 'hsl(var(--vip-gold))' }} />} accent="gold">
      {isHost && (
        <div className="mb-4 grid grid-cols-4 gap-2">
          {[
            { tier: 'bronze', reward: 100, emoji: '🥉' },
            { tier: 'silver', reward: 500, emoji: '🥈' },
            { tier: 'gold', reward: 2000, emoji: '🥇' },
            { tier: 'diamond', reward: 5000, emoji: '💎' },
          ].map((t) => (
            <button
              key={t.tier}
              onClick={() => drop(t.tier, t.reward)}
              className="rounded-2xl p-3 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]"
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="text-[10px] text-white/60 mt-1">{t.reward}💎</div>
            </button>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {boxes.map((b) => (
          <div
            key={b.id}
            className={cn(
              'p-3 rounded-2xl border flex items-center justify-between',
              b.opened_by ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/[0.05] border-white/15',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <div>
                <div className="text-sm font-semibold text-white uppercase">{b.tier}</div>
                <div className="text-[10px]" style={{ color: 'hsl(var(--vip-gold))' }}>
                  {b.reward_coins} 💎
                </div>
              </div>
            </div>
            {!b.opened_by && !isHost && (
              <Button size="sm" onClick={() => open_(b.id)} className="rounded-full h-8 text-xs" style={{ background: 'var(--gradient-vip)', color: '#000' }}>
                فتح
              </Button>
            )}
            {b.opened_by && <span className="text-[10px] text-white/40">مفتوح</span>}
          </div>
        ))}
        {boxes.length === 0 && <div className="text-center py-6 text-white/30 text-sm">لا صناديق بعد</div>}
      </div>
    </Sheet>
  );
};
