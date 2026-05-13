import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function FinancialIntelPanel() {
  const [series, setSeries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [totals, setTotals] = useState({ commission: 0, gross: 0 });

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: gifts } = await supabase.from('gift_ledger')
        .select('platform_fee, total_price, created_at')
        .eq('status', 'confirmed').gte('created_at', since).order('created_at');

      const buckets: Record<string, { hour: string; commission: number; gross: number }> = {};
      let commission = 0, gross = 0;
      (gifts || []).forEach((g: any) => {
        const h = new Date(g.created_at).toISOString().slice(0, 13) + ':00';
        if (!buckets[h]) buckets[h] = { hour: h.slice(11, 16), commission: 0, gross: 0 };
        buckets[h].commission += Number(g.platform_fee || 0);
        buckets[h].gross += Number(g.total_price || 0);
        commission += Number(g.platform_fee || 0);
        gross += Number(g.total_price || 0);
      });
      setSeries(Object.values(buckets));
      setTotals({ commission, gross });

      const { data: al } = await supabase.from('financial_alerts')
        .select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(20);
      setAlerts(al || []);
    };
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-[#39FF14]/15 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#39FF14]" />
          <h3 className="text-sm font-mono tracking-widest text-[#39FF14]">REVENUE & COMMISSION (24H)</h3>
          <div className="ml-auto flex gap-3 text-[11px] font-mono">
            <span className="text-white/50">Gross: <span className="text-white">{totals.gross.toLocaleString()}</span></span>
            <span className="text-white/50">Platform 20%: <span className="text-[#39FF14]">{totals.commission.toLocaleString()}</span></span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39FF14" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ffffff08" />
              <XAxis dataKey="hour" tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ background: '#000', border: '1px solid #39FF1430', fontFamily: 'monospace', fontSize: 11 }} />
              <Area type="monotone" dataKey="commission" stroke="#39FF14" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-amber-500/20 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-mono tracking-widest text-amber-400">FLAGGED WALLETS</h3>
        </div>
        <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-white/[0.03]">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-white/30 text-xs font-mono">NO ANOMALIES</div>
          ) : alerts.map(a => (
            <div key={a.id} className="px-4 py-2 flex items-center gap-3">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px] font-mono">{a.alert_type}</span>
              <span className="text-[11px] font-mono text-white/70">{a.user_id?.slice(0, 12)}…</span>
              <span className="text-[11px] font-mono text-amber-400 ml-auto">{Number(a.amount).toLocaleString()}</span>
              <span className="text-[10px] font-mono text-white/30">/{a.window_minutes}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
