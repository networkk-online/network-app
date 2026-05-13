import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Power, Radio, KeyRound, AlertOctagon } from 'lucide-react';

export default function RemoteCommandPanel() {
  const { toast } = useToast();
  const [streams, setStreams] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [targetUser, setTargetUser] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('live_streams').select('*').eq('status', 'live').limit(20);
    setStreams(data || []);
    const { data: m } = await supabase.from('app_settings').select('value').eq('key', 'maintenance_mode').maybeSingle();
    setMaintenance(!!(m?.value as any)?.enabled);
  };

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, []);

  const cmd = async (action: string, target?: string, payload: any = {}) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke('admin-remote-command', {
      body: { action, target_user_id: target, payload },
    });
    setBusy(false);
    if (error) { toast({ title: '❌ فشل', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✓ تم تنفيذ الأمر' });
    load();
  };

  return (
    <div className="space-y-3">
      {/* Maintenance kill switch */}
      <div className={`rounded-2xl backdrop-blur-xl border p-4 ${maintenance ? 'bg-red-500/10 border-red-500/40' : 'bg-white/[0.04] border-[#39FF14]/15'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${maintenance ? 'bg-red-500/20 border border-red-500/40' : 'bg-[#39FF14]/10 border border-[#39FF14]/30'}`}>
            <AlertOctagon className={`w-6 h-6 ${maintenance ? 'text-red-400 animate-pulse' : 'text-[#39FF14]'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold font-mono tracking-widest text-white">MASTER KILL SWITCH</h3>
            <p className="text-[11px] text-white/50 font-mono">{maintenance ? 'SYSTEM LOCKED — only admin can access' : 'System operational'}</p>
          </div>
          <button
            disabled={busy}
            onClick={() => {
              if (!confirm(maintenance ? 'رفع وضع الصيانة؟' : 'تفعيل وضع الصيانة الآن؟')) return;
              cmd('set_maintenance', undefined, { enabled: !maintenance });
            }}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs tracking-widest border transition ${
              maintenance ? 'bg-[#39FF14]/15 border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/25'
                : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
            }`}>
            {maintenance ? 'RESUME' : 'ACTIVATE'}
          </button>
        </div>
      </div>

      {/* Active streams */}
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#FF3939] animate-pulse" />
          <h3 className="text-sm font-mono tracking-widest text-white">ACTIVE LIVE STREAMS</h3>
          <span className="ml-auto text-[10px] font-mono text-white/40">{streams.length}</span>
        </div>
        <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-white/[0.03]">
          {streams.length === 0 ? (
            <div className="py-6 text-center text-white/30 text-xs font-mono">NO LIVE STREAMS</div>
          ) : streams.map(s => (
            <div key={s.id} className="px-4 py-2.5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-white truncate">{s.title || s.channel_name || s.id?.slice(0, 8)}</p>
                <p className="text-[10px] font-mono text-white/40">host: {s.host_id?.slice(0, 12)}…</p>
              </div>
              <button
                disabled={busy}
                onClick={() => { if (confirm('إنهاء البث الآن؟')) cmd('kill_live', s.host_id); }}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono hover:bg-red-500/25 flex items-center gap-1">
                <Power className="w-3 h-3" /> KILL
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Revoke sessions */}
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-mono tracking-widest text-amber-400">REVOKE USER SESSIONS</h3>
        </div>
        <div className="flex gap-2">
          <input
            value={targetUser}
            onChange={e => setTargetUser(e.target.value)}
            placeholder="user_id (uuid)"
            className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-white/20 focus:border-[#39FF14]/40 outline-none" />
          <button
            disabled={busy || !targetUser}
            onClick={() => cmd('revoke_sessions', targetUser.trim())}
            className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono hover:bg-amber-500/25 disabled:opacity-40">
            REVOKE
          </button>
          <button
            disabled={busy || !targetUser}
            onClick={() => cmd('shadow_ban', targetUser.trim(), { reason: 'manual admin action' })}
            className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/25 disabled:opacity-40">
            SHADOW BAN
          </button>
        </div>
      </div>
    </div>
  );
}
