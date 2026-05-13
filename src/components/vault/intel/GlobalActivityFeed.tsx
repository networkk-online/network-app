import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Smartphone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_COLOR: Record<string, string> = {
  signup_apple: '#A855F7', signup_google: '#3B82F6', login: '#39FF14',
  live_start: '#FF3939', gem_transfer_high: '#FBBF24',
  threat_detected: '#FF3939', admin_kill_live: '#FF3939',
  admin_shadow_ban: '#FF3939', admin_set_maintenance: '#FBBF24',
};

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'signup', label: 'التسجيل' },
  { id: 'live_start', label: 'البث' },
  { id: 'gem_transfer_high', label: 'هدايا' },
  { id: 'threat_detected', label: 'تهديدات' },
];

export default function GlobalActivityFeed() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('activity_intel')
        .select('*').order('created_at', { ascending: false }).limit(100);
      setEvents(data || []);
    };
    load();
    const ch = supabase.channel('activity_intel_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_intel' }, (payload) => {
        setEvents(prev => [payload.new as any, ...prev].slice(0, 100));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = events.filter(e =>
    filter === 'all' ? true : filter === 'signup' ? e.event_type.startsWith('signup') : e.event_type === filter
  );

  return (
    <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-[#39FF14]/15 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
          <h3 className="text-sm font-mono tracking-widest text-[#39FF14]">LIVE INTELLIGENCE FEED</h3>
        </div>
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('px-2.5 py-1 rounded-lg text-[10px] font-mono transition',
                filter === f.id ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30' : 'text-white/40 hover:text-white/70')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-xs font-mono">NO ACTIVITY</div>
        ) : filtered.map(e => {
          const color = TYPE_COLOR[e.event_type] || '#39FF14';
          const isCritical = e.severity === 'critical' || e.severity === 'warning';
          return (
            <div key={e.id} className="px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold" style={{ color }}>{e.event_type}</span>
                  {isCritical && <AlertCircle className="w-3 h-3 text-red-400" />}
                  <span className="text-[10px] text-white/30 font-mono">
                    {new Date(e.created_at).toLocaleTimeString('en-US', { hour12: false })}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/40 font-mono">
                  {e.country && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{e.country}{e.city ? ` · ${e.city}` : ''}</span>}
                  {e.device && <span className="flex items-center gap-1"><Smartphone className="w-2.5 h-2.5" />{e.device}{e.os ? ` · ${e.os}` : ''}</span>}
                  {e.ip && e.ip !== 'unknown' && <span>IP: {e.ip}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
