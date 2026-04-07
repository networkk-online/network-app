import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, DollarSign, Gem, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VaultFinance = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [totalGems, setTotalGems] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => { loadFinance(); }, []);

  const loadFinance = async () => {
    setLoading(true);
    const [depsRes, withRes, gemsRes, balRes] = await Promise.all([
      supabase.from('deposits').select('*, profiles!deposits_user_id_fkey(username, full_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('withdrawals').select('*, profiles!withdrawals_user_id_fkey(username, full_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('user_gems').select('balance'),
      supabase.from('user_finances').select('balance'),
    ]);
    setDeposits(depsRes.data || []);
    setWithdrawals(withRes.data || []);
    setTotalGems((gemsRes.data || []).reduce((s, g) => s + (g.balance || 0), 0));
    setTotalBalance((balRes.data || []).reduce((s, f) => s + (f.balance || 0), 0));
    setLoading(false);
  };

  const handleDeposit = async (id: string, action: 'approved' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('deposits').update({
      status: action, reviewed_at: new Date().toISOString(), reviewed_by: user?.id,
    }).eq('id', id);
    if (action === 'approved') {
      const dep = deposits.find(d => d.id === id);
      if (dep) {
        await supabase.from('user_finances').upsert({
          user_id: dep.user_id, balance: dep.amount, total_earnings: dep.amount,
        }, { onConflict: 'user_id' });
      }
    }
    toast({ title: action === 'approved' ? '✅ تمت الموافقة' : '❌ تم الرفض' });
    loadFinance();
  };

  const formatAmount = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

  if (loading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/[0.04]" />)}</div>;

  const currentData = tab === 'deposits' ? deposits : withdrawals;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي Gems', value: formatAmount(totalGems), icon: Gem, color: '#A855F7' },
          { label: 'الرصيد الكلي', value: `$${formatAmount(totalBalance)}`, icon: DollarSign, color: '#39FF14' },
          { label: 'إيداعات معلقة', value: deposits.filter(d => d.status === 'pending').length, icon: ArrowDownLeft, color: '#FFD700' },
          { label: 'سحب معلق', value: withdrawals.filter(w => w.status === 'pending').length, icon: ArrowUpRight, color: '#FF6B6B' },
        ].map(s => (
          <Card key={s.label} className="bg-white/[0.03] border-white/[0.06]">
            <CardContent className="p-4">
              <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-bold text-white font-mono">{s.value}</p>
              <p className="text-[10px] text-white/25 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['deposits', 'withdrawals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-xs transition-all ${tab === t ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30' : 'bg-white/[0.04] text-white/30'}`}>
            {t === 'deposits' ? 'الإيداعات' : 'السحوبات'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {currentData.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.06]"><CardContent className="py-12 text-center text-white/20 text-sm">لا توجد عمليات</CardContent></Card>
        ) : currentData.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tab === 'deposits' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {tab === 'deposits' ? <ArrowDownLeft className="w-5 h-5 text-green-400" /> : <ArrowUpRight className="w-5 h-5 text-red-400" />}
              </div>
              <div>
                <p className="text-white text-sm">{(item as any).profiles?.full_name || (item as any).profiles?.username || 'مجهول'}</p>
                <p className="text-[10px] text-white/20 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('ar-IQ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-white font-bold font-mono">{item.amount?.toLocaleString()} IQD</p>
              <Badge className={
                item.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' :
                item.status === 'approved' ? 'bg-[#39FF14]/15 text-[#39FF14]' : 'bg-red-500/15 text-red-400'
              }>
                {item.status === 'pending' ? 'معلّق' : item.status === 'approved' ? 'مقبول' : 'مرفوض'}
              </Badge>
              {item.status === 'pending' && tab === 'deposits' && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => handleDeposit(item.id, 'approved')} className="bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30 h-7 text-[10px]">قبول</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeposit(item.id, 'rejected')} className="text-red-400 hover:bg-red-500/10 h-7 text-[10px]">رفض</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VaultFinance;
