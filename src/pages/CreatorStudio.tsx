import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, Eye, Clock, Gem, Film, Upload, Users,
  BarChart3, DollarSign, Settings, Video, ThumbsUp, MessageSquare,
  Play, Radio, MoreVertical, Globe, Lock, Tv, Wallet, ArrowDownToLine,
  Megaphone, CreditCard, Banknote, Menu, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useCountUp } from '@/hooks/useCountUp';
import { toast } from 'sonner';

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

/* ───── White Neon Brand ───── */
const NeonBrand = () => (
  <h1 className="text-sm sm:text-base font-semibold tracking-tight select-none whitespace-nowrap">
    <motion.span className="text-foreground"
      animate={{ textShadow: ['0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)', '0 0 12px rgba(255,255,255,0.6), 0 0 25px rgba(255,255,255,0.3)', '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >Networkk</motion.span>
    <motion.span className="text-foreground ml-1"
      animate={{ textShadow: ['0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)', '0 0 12px rgba(255,255,255,0.6), 0 0 25px rgba(255,255,255,0.3)', '0 0 7px rgba(255,255,255,0.4), 0 0 15px rgba(255,255,255,0.2)'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
    >Cinema</motion.span>{' '}
    <span className="text-foreground/60 font-normal">Studio</span>
  </h1>
);

/* ───── Animated Stat Card ───── */
const StatCard = ({ label, value, icon: Icon, accent, delay, onClick }: {
  label: string; value: number; icon: any; accent: string; delay: number; onClick?: () => void;
}) => {
  const count = useCountUp({ end: value, duration: 1200, delay: delay * 100 });
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.96 }}
      transition={{ delay: delay * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 sm:p-4 relative overflow-hidden ${onClick ? 'cursor-pointer hover:bg-white/[0.05]' : ''}`}
      style={{ boxShadow: `0 0 20px ${accent}` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-muted-foreground text-[9px] sm:text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground text-left" dir="ltr">
        {label === 'الأرباح' ? `$${count.toLocaleString()}` : count.toLocaleString()}
      </p>
    </motion.div>
  );
};

/* ───── Withdraw Modal ───── */
const WithdrawModal = ({ open, onClose, balance }: { open: boolean; onClose: () => void; balance: number }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('zaincash');

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) { toast.error('أدخل مبلغاً صالحاً'); return; }
    if (Number(amount) > balance) { toast.error('الرصيد غير كافٍ'); return; }
    toast.success(`تم إرسال طلب سحب $${amount} عبر ${method === 'zaincash' ? 'زين كاش' : 'تحويل بنكي'}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[80]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[90] bg-background/90 backdrop-blur-[60px] border border-white/[0.08] rounded-2xl p-5 sm:p-6"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            dir="rtl"
          >
            <h3 className="text-foreground font-bold text-lg mb-1">سحب الأرباح</h3>
            <p className="text-muted-foreground text-xs mb-4">الرصيد المتاح: <span className="text-primary font-bold">${balance}</span></p>
            <label className="text-foreground/60 text-xs mb-1 block">المبلغ ($)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-foreground text-lg font-bold outline-none mb-4" />
            <label className="text-foreground/60 text-xs mb-2 block">طريقة الدفع</label>
            <div className="flex gap-2 mb-5">
              {[
                { id: 'zaincash', label: 'زين كاش', icon: Wallet },
                { id: 'bank', label: 'تحويل بنكي', icon: Banknote },
              ].map(m => (
                <motion.button key={m.id} whileTap={{ scale: 0.95 }}
                  onClick={() => setMethod(m.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                    method === m.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/[0.03] border-white/[0.06] text-foreground/60'
                  }`}>
                  <m.icon className="w-4 h-4" strokeWidth={1.5} />
                  {m.label}
                </motion.button>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-foreground/60 text-sm font-medium">إلغاء</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleWithdraw}
                className="flex-1 py-3 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold">سحب</motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════ */
/* ═══ Main ═══ */
/* ═══════════════════════════════════════════════ */
const CreatorStudio = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalViews: 0, totalEarnings: 0, totalHours: 0, videoCount: 0, subscribers: 0, likes: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  /* ───── Tab Content Renderers ───── */
  const renderDashboard = () => (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <StatCard label="المشتركين" value={stats.subscribers} icon={Users} accent="hsla(144,90%,33%,0.15)" delay={0} onClick={() => setActiveTab('analytics')} />
        <StatCard label="المشاهدات" value={stats.totalViews} icon={Eye} accent="hsla(0,0%,75%,0.1)" delay={1} onClick={() => setActiveTab('analytics')} />
        <StatCard label="الأرباح" value={stats.totalEarnings} icon={Gem} accent="hsla(144,90%,33%,0.2)" delay={2} onClick={() => setActiveTab('monetization')} />
        <StatCard label="الإعجابات" value={stats.likes} icon={ThumbsUp} accent="hsla(220,80%,60%,0.1)" delay={3} onClick={() => setActiveTab('analytics')} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />تحليلات المشاهدات</h3>
          <span className="text-muted-foreground text-[11px]">آخر 7 أيام</span>
        </div>
        <ChartContainer config={chartConfig} className="h-[180px] sm:h-[220px] w-full">
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-foreground text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />ساعات المشاهدة</h3>
          <span className="text-foreground/50 text-lg font-bold">{stats.totalHours}h</span>
        </div>
        <ChartContainer config={chartConfig} className="h-[150px] sm:h-[180px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="watchTime" fill="hsl(144, 70%, 45%)" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ChartContainer>
      </motion.div>

      <motion.button whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="w-full bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 text-primary hover:bg-primary/15 transition-colors"
        style={{ boxShadow: '0 0 20px hsla(144, 90%, 33%, 0.1)' }}>
        <Upload className="w-5 h-5" strokeWidth={1.5} />
        <span className="text-sm font-medium">رفع فيديو جديد</span>
      </motion.button>
    </div>
  );

  const renderContent = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground text-sm font-semibold flex items-center gap-2"><Film className="w-4 h-4 text-primary" strokeWidth={1.5} />مدير المحتوى</h3>
        <span className="text-muted-foreground text-[11px]">{stats.videoCount} فيديو</span>
      </div>
      {videos.length === 0 ? (
        <div className="text-center py-8">
          <Film className="w-10 h-10 text-white/[0.06] mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">لم ترفع أي فيديو بعد</p>
        </div>
      ) : (
        <div className="space-y-1">
          {videos.slice(0, 10).map((v, i) => (
            <motion.div key={v.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/watch/${v.id}`)}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
              <div className="relative w-20 sm:w-28 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-white/10" /></div>
                )}
                {v.duration > 0 && (
                  <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] text-foreground/80 font-mono">
                    {Math.floor(v.duration / 60)}:{(v.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
                {i === 0 && (Date.now() - new Date(v.created_at).getTime()) < 86400000 && (
                  <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/90 text-[8px] text-white font-bold">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />جديد
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs sm:text-sm font-medium line-clamp-1">{v.title}</p>
                <div className="flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 mt-1 text-muted-foreground text-[10px] sm:text-[11px]">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(v.views_count || 0)}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {formatViews(v.likes_count || 0)}</span>
                  <span className="hidden sm:flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {formatViews(v.comments_count || 0)}</span>
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); toast.info('ميزة الترويج قريباً'); }}
                  className="p-1.5 rounded-full hover:bg-primary/10 transition-colors" title="ترويج الفيديو">
                  <Megaphone className="w-3.5 h-3.5 text-primary/60" />
                </motion.button>
                <button className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-foreground/30" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderAnalytics = () => (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <StatCard label="المشاهدات" value={stats.totalViews} icon={Eye} accent="hsla(0,0%,75%,0.1)" delay={0} />
        <StatCard label="ساعات المشاهدة" value={stats.totalHours} icon={Clock} accent="hsla(144,90%,33%,0.15)" delay={1} />
        <StatCard label="المشتركين" value={stats.subscribers} icon={Users} accent="hsla(144,90%,33%,0.2)" delay={2} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
        <h3 className="text-foreground text-sm font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-primary" />أداء القناة - آخر 7 أيام</h3>
        <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="viewsGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(144, 90%, 33%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(144, 90%, 33%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="views" stroke="hsl(144, 90%, 33%)" strokeWidth={2} fill="url(#viewsGrad2)" />
          </AreaChart>
        </ChartContainer>
      </motion.div>
    </div>
  );

  const renderMonetization = () => (
    <div className="space-y-5 sm:space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-foreground text-sm font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />أرباحي</h3>
          <span className="text-muted-foreground text-[10px]">تقسيم 80/20</span>
        </div>
        <p className="text-3xl sm:text-4xl font-bold text-primary mt-3" dir="ltr" style={{ textShadow: '0 0 20px hsla(144,90%,33%,0.3)' }}>
          ${stats.totalEarnings.toLocaleString()}
        </p>
        <p className="text-muted-foreground text-xs mt-1">الرصيد المتاح للسحب</p>
        <div className="flex gap-3 mt-5">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowWithdraw(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 border border-primary/25 text-primary text-sm font-bold hover:bg-primary/20 transition-colors">
            <ArrowDownToLine className="w-4 h-4" />سحب
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-foreground/60 text-sm font-medium hover:bg-white/[0.06] transition-colors">
            <CreditCard className="w-4 h-4" />سجل الأرباح
          </motion.button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5">
        <h3 className="text-foreground text-sm font-semibold flex items-center gap-2 mb-4"><DollarSign className="w-4 h-4 text-primary" />مصادر الدخل</h3>
        <div className="space-y-3">
          {[
            { label: 'إعلانات داخلية', amount: 0, icon: Megaphone },
            { label: 'دعم المشاهدين', amount: 0, icon: Gem },
            { label: 'ترويج الفيديوهات', amount: 0, icon: TrendingUp },
          ].map((src, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <src.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-foreground/70 text-sm">{src.label}</span>
              </div>
              <span className="text-foreground font-bold text-sm" dir="ltr">${src.amount}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderCustomization = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 sm:p-5">
      <h3 className="text-foreground text-sm font-semibold flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-primary" />إعدادات القناة</h3>
      <div className="space-y-4">
        {[
          { label: 'إعدادات التحميل الافتراضية', desc: 'خصوصية، فئة، وصف تلقائي' },
          { label: 'تحقيق الدخل', desc: 'إعلانات، رعاية، اشتراكات' },
          { label: 'العلامة التجارية', desc: 'شعار القناة، الألوان، اللافتة' },
        ].map((item, i) => (
          <motion.button key={i} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors text-right">
            <div>
              <p className="text-foreground text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground/20 rotate-180 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const tabContent: Record<string, () => JSX.Element> = {
    dashboard: renderDashboard,
    content: renderContent,
    analytics: renderAnalytics,
    monetization: renderMonetization,
    customization: renderCustomization,
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} balance={stats.totalEarnings} />

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70]" onClick={() => setMobileSidebarOpen(false)} />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[260px] bg-background/95 backdrop-blur-2xl border-l border-white/[0.06] z-[80] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <NeonBrand />
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground/60" />
                </motion.button>
              </div>
              {userProfile && (
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-primary/30">
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary font-bold">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-semibold truncate">{userProfile?.full_name || 'المبدع'}</p>
                      <p className="text-muted-foreground text-[10px] truncate">@{userProfile?.username || 'user'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatViews(stats.subscribers)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(stats.totalViews)}</span>
                  </div>
                </div>
              )}
              <nav className="flex-1 py-2 overflow-y-auto">
                {sidebarTabs.map(tab => (
                  <motion.button key={tab.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { setActiveTab(tab.id); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                      activeTab === tab.id ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-foreground/60 hover:bg-white/[0.04]'
                    }`}>
                    <tab.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </nav>
              <div className="p-3 border-t border-white/[0.06]">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/network-tv')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-foreground/70">
                  <Tv className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  العودة إلى Cinema
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="hidden md:flex flex-col w-[200px] bg-background/80 backdrop-blur-2xl border-l border-white/[0.06] fixed top-0 right-0 bottom-0 z-30">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/30">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-base">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold truncate">{userProfile?.full_name || 'المبدع'}</p>
              <p className="text-muted-foreground text-[10px] truncate">@{userProfile?.username || 'user'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatViews(stats.subscribers)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViews(stats.totalViews)}</span>
            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {stats.videoCount}</span>
          </div>
        </div>

        <div className="p-2 border-b border-white/[0.06]">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/network-tv')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-xs">
            <Tv className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="text-foreground/70">العودة إلى Cinema</span>
          </motion.button>
        </div>

        <nav className="flex-1 py-3">
          {sidebarTabs.map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-foreground/60 hover:bg-white/[0.04]'
              }`}>
              <tab.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <NeonBrand />
        </div>
      </aside>

      {/* ═══ Main Content ═══ */}
      <div className="md:mr-[200px] min-w-0">
        <header className="sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-2xl border-b border-white/[0.06] flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
          {/* Mobile hamburger */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Menu className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="hidden md:flex w-9 h-9 rounded-full bg-white/[0.04] items-center justify-center flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-foreground/60" strokeWidth={1.4} />
          </motion.button>

          <div className="flex-1 min-w-0">
            <NeonBrand />
          </div>

          {/* Mobile tab icons */}
          <div className="md:hidden flex gap-0.5 flex-shrink-0">
            {sidebarTabs.slice(0, 4).map(tab => (
              <motion.button key={tab.id} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab(tab.id)}
                className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-foreground/40'}`}>
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
              </motion.button>
            ))}
          </div>

          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-1 ring-white/10 flex-shrink-0">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{(userProfile?.full_name || 'U')[0]}</AvatarFallback>
          </Avatar>
        </header>

        <div className="px-3 sm:px-4 md:px-6 pb-28 pt-4 sm:pt-5 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {tabContent[activeTab]?.()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
