import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Shield, AlertTriangle, DollarSign } from 'lucide-react';

const Card = ({ icon: Icon, label, value, accent = '#39FF14' }: any) => (
  <div className="relative p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-[#39FF14]/15 overflow-hidden">
    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: accent }} />
    <div className="flex items-center justify-between relative">
      <div>
        <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase">{label}</p>
        <p className="text-2xl font-bold font-mono mt-1" style={{ color: accent }}>{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
    </div>
  </div>
);

export default function IntelStatCards() {
  const [s, setS] = useState({ threats: 0, signups: 0, gifts: 0, revenue: 0 });

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const hourAgo = new Date(Date.now() - 3600_000).toISOString();
      const [t, signups, gifts, rev] = await Promise.all([
        supabase.from('threat_flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('gift_ledger').select('id', { count: 'exact', head: true }).gte('created_at', hourAgo),
        supabase.from('gift_ledger').select('platform_fee').eq('status', 'confirmed').gte('created_at', today.toISOString()),
      ]);
      const revenue = (rev.data || []).reduce((a: number, r: any) => a + Number(r.platform_fee || 0), 0);
      setS({ threats: t.count || 0, signups: signups.count || 0, gifts: gifts.count || 0, revenue });
    };
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card icon={AlertTriangle} label="ACTIVE THREATS" value={s.threats} accent="#FF3939" />
      <Card icon={Activity} label="SIGNUPS TODAY" value={s.signups} />
      <Card icon={Shield} label="GIFTS / 1H" value={s.gifts} />
      <Card icon={DollarSign} label="REVENUE 24H" value={s.revenue.toLocaleString()} />
    </div>
  );
}
