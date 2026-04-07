import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Film, TrendingUp } from 'lucide-react';

const MasterOverview = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, reels: 0, deposits: 0 });

  useEffect(() => {
    const load = async () => {
      const [u, p, r, d] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('reels').select('id', { count: 'exact', head: true }),
        supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      setStats({ users: u.count || 0, posts: p.count || 0, reels: r.count || 0, deposits: d.count || 0 });
    };
    load();
  }, []);

  const cards = [
    { label: 'المستخدمين', value: stats.users, icon: Users, color: '#39FF14' },
    { label: 'المنشورات', value: stats.posts, icon: FileText, color: '#00D4FF' },
    { label: 'الريلز', value: stats.reels, icon: Film, color: '#FF6B35' },
    { label: 'إيداعات معلقة', value: stats.deposits, icon: TrendingUp, color: '#FFD700' },
  ];

  return (
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
              <p className="text-2xl font-bold text-white">{c.value.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{c.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MasterOverview;
