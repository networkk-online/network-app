import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Film, TrendingUp, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { toast } from 'sonner';

const MasterOverview = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, reels: 0, deposits: 0 });
  const [busy, setBusy] = useState<null | 'create' | 'delete'>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const loadStats = useCallback(async () => {
    const [u, p, r, d] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reels').select('id', { count: 'exact', head: true }),
      supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({ users: u.count || 0, posts: p.count || 0, reels: r.count || 0, deposits: d.count || 0 });
  }, []);

  useEffect(() => {
    loadStats();
    // Live updates: refresh on profile changes + poll while busy
    const channel = supabase
      .channel('admin-overview-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(loadStats, 1500);
    return () => clearInterval(id);
  }, [busy, loadStats]);

  const animatedUsers = useCountUp({ end: stats.users, duration: 1200 });

  const handleGenerate = async () => {
    if (busy) return;
    setBusy('create');
    setStatusMsg('Generating 2500 users...');
    try {
      const { data, error } = await supabase.functions.invoke('admin-bulk-create-users', {
        body: { count: 2500, batchSize: 50, prefix: 'mock' },
      });
      if (error) throw error;
      toast.success(`تم إنشاء ${data?.created ?? 0} مستخدم (فشل ${data?.failed ?? 0})`);
    } catch (e: any) {
      toast.error(e.message || 'فشل الإنشاء');
    } finally {
      await loadStats();
      setBusy(null);
      setStatusMsg('');
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    if (!confirm('حذف جميع المستخدمين الوهميين؟')) return;
    setBusy('delete');
    setStatusMsg('Cleanup in progress...');
    try {
      const { data, error } = await supabase.functions.invoke('admin-bulk-delete-test-users', {
        body: { prefix: 'mock' },
      });
      if (error) throw error;
      toast.success(`تم حذف ${data?.deleted ?? 0} مستخدم`);
    } catch (e: any) {
      toast.error(e.message || 'فشل الحذف');
    } finally {
      await loadStats();
      setBusy(null);
      setStatusMsg('');
    }
  };

  const cards = [
    { label: 'المستخدمين', value: animatedUsers, icon: Users, color: '#39FF14' },
    { label: 'المنشورات', value: stats.posts, icon: FileText, color: '#00D4FF' },
    { label: 'الريلز', value: stats.reels, icon: Film, color: '#FF6B35' },
    { label: 'إيداعات معلقة', value: stats.deposits, icon: TrendingUp, color: '#FFD700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.color + '15' }}>
                    <Icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{c.value.toLocaleString()}</p>
                <p className="text-xs text-white/40 mt-1">{c.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hidden / protected Admin Tools — only visible inside Master vault */}
      <Card
        className="border bg-white/[0.03] backdrop-blur-2xl"
        style={{
          borderColor: 'rgba(57,255,20,0.2)',
          boxShadow: '0 0 30px rgba(57,255,20,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-wider" style={{ color: '#39FF14' }}>
                ADMIN TOOLS · أدوات مخفية
              </h3>
              <p className="text-[11px] text-white/40 mt-1">
                إدارة المستخدمين الوهميين للاختبار — حساس، استخدم بحذر
              </p>
            </div>
            {busy && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#39FF14' }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono tracking-wider">{statusMsg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGenerate}
              disabled={!!busy}
              className="group relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(57,255,20,0.15) 0%, rgba(57,255,20,0.05) 100%)',
                border: '1px solid rgba(57,255,20,0.35)',
                color: '#39FF14',
                boxShadow: '0 0 20px rgba(57,255,20,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {busy === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{busy === 'create' ? 'Generating...' : 'Generate 2500 Users'}</span>
              </div>
            </button>

            <button
              onClick={handleDelete}
              disabled={!!busy}
              className="group relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(255,68,68,0.12) 0%, rgba(255,68,68,0.04) 100%)',
                border: '1px solid rgba(255,68,68,0.35)',
                color: '#ff6b6b',
                boxShadow: '0 0 20px rgba(255,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{busy === 'delete' ? 'Cleanup in progress...' : 'Delete All Mock Users'}</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterOverview;
