import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, Video, Heart, BadgeCheck, MessageCircle } from 'lucide-react';

const AdminStatsCards = () => {
  const [stats, setStats] = useState({ users: 0, posts: 0, reels: 0, likes: 0, verified: 0, comments: 0 });

  useEffect(() => {
    const load = async () => {
      const [u, p, r, l, c] = await Promise.all([
        supabase.from('profiles').select('id, is_verified', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reels').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: u.count || 0,
        posts: p.count || 0,
        reels: r.count || 0,
        likes: l.count || 0,
        verified: u.data?.filter(x => x.is_verified).length || 0,
        comments: c.count || 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: 'المستخدمين', value: stats.users, icon: Users, color: 'text-blue-400' },
    { label: 'موثّقون', value: stats.verified, icon: BadgeCheck, color: 'text-green-400' },
    { label: 'المنشورات', value: stats.posts, icon: FileText, color: 'text-purple-400' },
    { label: 'الريلز', value: stats.reels, icon: Video, color: 'text-red-400' },
    { label: 'الإعجابات', value: stats.likes, icon: Heart, color: 'text-pink-400' },
    { label: 'التعليقات', value: stats.comments, icon: MessageCircle, color: 'text-yellow-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((s) => (
        <Card key={s.label} className="bg-[#111] border-border/20">
          <CardContent className="p-3 flex items-center gap-3">
            <s.icon className={`h-7 w-7 ${s.color}`} />
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatsCards;
