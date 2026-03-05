import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, Eye, Clock, Gem, Film, Upload, Users,
  BarChart3, DollarSign, Settings, Video, ThumbsUp, MessageSquare,
  Play, Radio, MoreVertical, Globe, Lock, Tv
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import nCinemaLogo from '@/assets/n-cinema-logo.png';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';

const sidebarTabs = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
  { id: 'content', label: 'المحتوى', icon: Video },
  { id: 'analytics', label: 'التحليلات', icon: TrendingUp },
  { id: 'monetization', label: 'الأرباح', icon: DollarSign },
  { id: 'customization', label: 'التخصيص', icon: Settings },
];

const formatViews = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
};

/* ───── Animated Stat Card ───── */
const StatCard = ({ label, value, icon: Icon, accent, delay }: {
  label: string; value: number; icon: any; accent: string; delay: number;
}) => {
  const count = useCountUp({ end: value, duration: 1200, delay: delay * 100 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 relative overflow-hidden"
      style={{ boxShadow: `0 0 20px ${accent}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground text-left" dir="ltr">
        {label === 'الأرباح' ? `$${count.toLocaleString()}` : count.toLocaleString()}
      </p>
    </motion.div>
  );
};

const CreatorStudio = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalViews: 0, totalEarnings: 0, totalHours: 0, videoCount: 0, subscribers: 0, likes: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setUserProfile(profile);

      const { data: vids } = await supabase.from('videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

      const v = vids || [];
      setVideos(v);

      const totalViews = v.reduce((a, b) => a + (b.views_count || 0), 0);
      const totalLikes = v.reduce((a, b) => a + (b.likes_count || 0), 0);
      setStats({
        totalViews,
        totalEarnings: 0,
        totalHours: Math.floor(v.reduce((a, b) => a + (b.duration || 0), 0) / 3600),
        videoCount: v.length,
        subscribers: profile?.followers_count || 0,
        likes: totalLikes,
      });

      const days = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
      setChartData(days.map((day) => ({
        day,
        views: Math.floor(Math.random() * (totalViews / 3 || 100) + 20),
        watchTime: Math.floor(Math.random() * 50 + 5),
      })));

      setLoading(false);
    };
    load();
  }, [navigate]);

  const chartConfig = {
    views: { label: 'المشاهدات', color: 'hsl(144, 90%, 33%)' },
    watchTime: { label: 'ساعات المشاهدة', color: 'hsl(144, 70%, 45%)' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* ═══ Sidebar ═══ */}
      <aside className="hidden md:flex flex-col w-[220px] bg-black/40 backdrop-blur-2xl border-l border-white/[0.06] sticky top-0 h-screen">
        {/* Channel Profile */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 ring-2 ring-primary/30">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                {(userProfile?.full_name || 'U')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold truncate">{userProfile?.full_name || 'المبدع'}</p>
              <p className="text-muted-foreground text-[10px] truncate">ملف القناة • @{userProfile?.username || 'user'}</p>
            </div>
          </div>
          {/* Channel stats mini */}
          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatViews(stats.subscribers)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(stats.totalViews)}</span>
            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {stats.videoCount}</span>
          </div>
        </div>

        {/* Switch back to Network */}
        <div className="p-2 border-b border-white/[0.06]">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/network-tv')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-xs"
          >
            <Tv className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="text-foreground/70">العودة إلى Cinema</span>
          </motion.button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3">
          {sidebarTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-foreground/60 hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Brand */}
        <div className="p-4 border-t border-white/[0.06] flex items-center gap-2">
          <motion.img
            src={nCinemaLogo}
            alt="N Cinema"
            className="w-7 h-7 object-contain"
            animate={{ filter: ['drop-shadow(0 0 4px hsla(144,90%,33%,0.3))', 'drop-shadow(0 0 10px hsla(144,90%,33%,0.5))', 'drop-shadow(0 0 4px hsla(144,90%,33%,0.3))'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[11px]">
            <span className="text-foreground/60 font-medium">Networkk</span>{' '}
            <span className="text-primary font-semibold">Cinema</span>{' '}
            <span className="text-muted-foreground">Studio</span>
          </p>
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-50 h-14 bg-black/40 backdrop-blur-2xl border-b border-white/[0.06] flex items-center px-4 gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-foreground/60" strokeWidth={1.4} />
          </motion.button>
          <div className="flex items-center gap-2.5 flex-1">
            <motion.img
              src={nCinemaLogo}
              alt="N Cinema"
              className="w-8 h-8 object-contain md:hidden"
              animate={{ filter: ['drop-shadow(0 0 4px hsla(144,90%,33%,0.3))', 'drop-shadow(0 0 10px hsla(144,90%,33%,0.5))', 'drop-shadow(0 0 4px hsla(144,90%,33%,0.3))'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="text-foreground text-base font-semibold">
              <span className="text-foreground">Networkk</span>{' '}
              <span className="text-primary">Cinema</span>{' '}
              <span className="text-foreground/60 font-normal">Studio</span>
            </h1>
          </div>

          {/* Mobile tab selector */}
          <div className="md:hidden flex gap-1">
            {sidebarTabs.slice(0, 3).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-foreground/40'}`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            ))}
          </div>

          <Avatar className="w-8 h-8 ring-1 ring-white/10">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {(userProfile?.full_name || 'U')[0]}
            </AvatarFallback>
          </Avatar>
        </header>

        <div className="px-4 md:px-6 pb-28 pt-5 max-w-5xl mx-auto space-y-6">
          {/* ═══ Channel Overview Cards ═══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="المشتركين" value={stats.subscribers} icon={Users} accent="hsla(144,90%,33%,0.15)" delay={0} />
            <StatCard label="المشاهدات" value={stats.totalViews} icon={Eye} accent="hsla(0,0%,75%,0.1)" delay={1} />
            <StatCard label="الأرباح" value={stats.totalEarnings} icon={Gem} accent="hsla(144,90%,33%,0.2)" delay={2} />
            <StatCard label="الإعجابات" value={stats.likes} icon={ThumbsUp} accent="hsla(220,80%,60%,0.1)" delay={3} />
          </div>

          {/* ═══ Views Chart ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                تحليلات المشاهدات
              </h3>
              <span className="text-muted-foreground text-[11px]">آخر 7 أيام</span>
            </div>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(144, 90%, 33%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(144, 90%, 33%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="views" stroke="hsl(144, 90%, 33%)" strokeWidth={2} fill="url(#viewsGradient)" />
              </AreaChart>
            </ChartContainer>
          </motion.div>

          {/* ═══ Watch Time Chart ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                ساعات المشاهدة
              </h3>
              <span className="text-foreground/50 text-lg font-bold">{stats.totalHours}h</span>
            </div>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="watchTime" fill="hsl(144, 70%, 45%)" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ChartContainer>
          </motion.div>

          {/* ═══ Upload CTA ═══ */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 text-primary hover:bg-primary/15 transition-colors"
            style={{ boxShadow: '0 0 20px hsla(144, 90%, 33%, 0.1)' }}
          >
            <Upload className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">رفع فيديو جديد</span>
          </motion.button>

          {/* ═══ Content Manager — Video List ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground text-sm font-semibold flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" strokeWidth={1.5} />
                مدير المحتوى
              </h3>
              <span className="text-muted-foreground text-[11px]">{stats.videoCount} فيديو</span>
            </div>
            {videos.length === 0 ? (
              <div className="text-center py-8">
                <Film className="w-10 h-10 text-white/[0.06] mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">لم ترفع أي فيديو بعد</p>
              </div>
            ) : (
              <div className="space-y-1">
                {videos.slice(0, 8).map((v, i) => (
                  <motion.div
                    key={v.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/watch/${v.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-white/10" />
                        </div>
                      )}
                      {/* Duration */}
                      {v.duration > 0 && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] text-foreground/80 font-mono">
                          {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                      {/* Live indicator (mock for recently created) */}
                      {i === 0 && (Date.now() - new Date(v.created_at).getTime()) < 86400000 && (
                        <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/90 text-[8px] text-white font-bold">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          جديد
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium line-clamp-1">{v.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-muted-foreground text-[11px]">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(v.views_count || 0)} مشاهدة</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {formatViews(v.likes_count || 0)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {formatViews(v.comments_count || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {v.is_published ? <Globe className="w-2.5 h-2.5 text-primary" /> : <Lock className="w-2.5 h-2.5" />}
                          {v.is_published ? 'عام' : 'خاص'}
                        </span>
                        <span>•</span>
                        <span>{v.created_at ? timeAgo(v.created_at) : ''}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <button className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors flex-shrink-0">
                      <MoreVertical className="w-4 h-4 text-foreground/30" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
