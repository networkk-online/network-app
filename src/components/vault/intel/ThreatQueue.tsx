import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Ban, Snowflake, Check } from 'lucide-react';

export default function ThreatQueue() {
  const [flags, setFlags] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('threat_flags')
      .select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50);
    setFlags(data || []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('threat_flags_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threat_flags' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const action = async (flag: any, act: 'shadow_ban' | 'lift_restriction' | 'dismiss') => {
    if (act === 'dismiss') {
      await supabase.from('threat_flags').update({ status: 'dismissed', reviewed_at: new Date().toISOString() }).eq('id', flag.id);
    } else {
      await supabase.functions.invoke('admin-remote-command', {
        body: { action: act, target_user_id: flag.user_id, payload: { reason: flag.flag_type } },
      });
      await supabase.from('threat_flags').update({ status: 'reviewed', reviewed_at: new Date().toISOString() }).eq('id', flag.id);
    }
    toast({ title: '✓ تم تنفيذ الإجراء' });
    load();
  };

  return (
    <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-[#FF3939]/20 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-[#FF3939]" />
        <h3 className="text-sm font-mono tracking-widest text-[#FF3939]">THREAT QUEUE</h3>
        <span className="ml-auto text-[10px] font-mono text-white/40">{flags.length} pending</span>
      </div>
      <div className="max-h-[480px] overflow-y-auto scrollbar-thin divide-y divide-white/[0.03]">
        {flags.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-xs font-mono">ALL CLEAR</div>
        ) : flags.map(f => (
          <div key={f.id} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                f.severity === 'high' ? 'bg-red-500/20 text-red-400' : f.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/15 text-yellow-300'
              }`}>{f.severity?.toUpperCase()}</span>
              <span className="text-xs font-mono text-white/70">{f.flag_type}</span>
              <span className="ml-auto text-[10px] text-white/30 font-mono">{new Date(f.created_at).toLocaleString('en-US', { hour12: false })}</span>
            </div>
            <p className="text-[11px] text-white/50 font-mono mb-1">user: <span className="text-white/70">{f.user_id?.slice(0, 8)}…</span></p>
            {f.evidence && (
              <pre className="text-[10px] bg-black/40 border border-white/5 rounded-lg p-2 text-white/50 font-mono overflow-x-auto whitespace-pre-wrap">{JSON.stringify(f.evidence, null, 2).slice(0, 400)}</pre>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={() => action(f, 'shadow_ban')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-mono hover:bg-red-500/25">
                <Ban className="w-3 h-3" /> Shadow Ban
              </button>
              <button onClick={() => action(f, 'lift_restriction')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-mono hover:bg-amber-500/25">
                <Snowflake className="w-3 h-3" /> Lift
              </button>
              <button onClick={() => action(f, 'dismiss')} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[11px] font-mono hover:bg-white/10">
                <Check className="w-3 h-3" /> Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
