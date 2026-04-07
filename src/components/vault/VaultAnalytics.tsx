import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Film, Heart, MessageCircle, TrendingUp, Eye, Activity, Zap } from 'lucide-react';

const VaultAnalytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalPosts: 0, totalReels: 0, totalLikes: 0,
    totalComments: 0, totalStories: 0, totalMessages: 0, verifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const [users, posts, reels, likes, comments, stories, messages, verified] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reels').select('id', { count: 'exact', head: true }),
      supabase.from('likes').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('stories').select('id', { count: 'exact', head: true }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
    ]);
    setStats({
      totalUsers: users.count || 0, totalPosts: posts.count || 0, totalReels: reels.count || 0,
      totalLikes: likes.count || 0, totalComments: comments.count || 0, totalStories: stories.count || 0,
      totalMessages: messages.count || 0, verifiedUsers: verified.count || 0,
    });
    setLoading(false);
  };

  const formatNum = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();

  const cards = [
    { label: 'المستخدمون', value: stats.totalUsers, icon: Users, color: '#39FF14' },
    { label: 'المنشورات', value: stats.totalPosts, icon: Activity, color: '#00D4FF' },
    { label: 'الريلز', value: stats.totalReels, icon: Film, color: '#FF6B6B' },
    { label: 'الإعجابات', value: stats.totalLikes, icon: Heart, color: '#FF1493' },
    { label: 'التعليقات', value: stats.totalComments, icon: MessageCircle, color: '#FFD700' },
    { label: 'الستوريز', value: stats.totalStories, icon: Eye, color: '#A855F7' },
    { label: 'الرسائل', value: stats.totalMessages, icon: MessageCircle, color: '#06B6D4' },
    { label: 'موثّقون', value: stats.verifiedUsers, icon: Zap, color: '#34D399' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.label} className="bg-white/[0.03] border-white/[0.06] group hover:border-white/[0.12] transition-all overflow-hidden relative">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at 50% 50%, ${c.color}10, transparent 70%)` }} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
                <TrendingUp className="w-3 h-3 text-white/15" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{loading ? '...' : formatNum(c.value)}</p>
              <p className="text-[10px] text-white/25 mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-6">
            <h3 className="text-sm text-white/40 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#39FF14]" /> نمو المستخدمين</h3>
            <div className="h-40 flex items-end gap-1">
              {Array.from({ length: 12 }).map((_, i) => {
                const h = 20 + Math.random() * 80;
                return <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80" style={{ height: `${h}%`, background: `linear-gradient(to top, #39FF1440, #39FF1415)` }} />;
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-white/15">
              {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map(m => <span key={m}>{m.slice(0, 3)}</span>)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-6">
            <h3 className="text-sm text-white/40 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#00D4FF]" /> التفاعل اليومي</h3>
            <div className="h-40 flex items-end gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const h = 10 + Math.random() * 90;
                return <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80" style={{ height: `${h}%`, background: `linear-gradient(to top, #00D4FF40, #00D4FF10)` }} />;
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-white/15">
              <span>1</span><span>10</span><span>20</span><span>30</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VaultAnalytics;
