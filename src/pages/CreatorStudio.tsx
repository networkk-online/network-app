import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Eye, Clock, Gem, Film, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

const CreatorStudio = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalViews: 0, totalEarnings: 0, totalHours: 0, videoCount: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: vids } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const v = vids || [];
      setVideos(v);
      setStats({
        totalViews: v.reduce((a, b) => a + (b.views_count || 0), 0),
        totalEarnings: 0,
        totalHours: Math.floor(v.reduce((a, b) => a + (b.duration || 0), 0) / 3600),
        videoCount: v.length,
      });
      setLoading(false);
    };
    load();
  }, [navigate]);

  const statCards = [
    { label: 'المشاهدات', value: stats.totalViews.toLocaleString(), icon: Eye, glow: 'hsla(0, 0%, 75%, 0.2)', color: 'text-white/80' },
    { label: 'الأرباح', value: `$${stats.totalEarnings}`, icon: Gem, glow: 'hsla(144, 90%, 33%, 0.2)', color: 'text-primary' },
    { label: 'ساعات المشاهدة', value: stats.totalHours.toString(), icon: Clock, glow: 'hsla(45, 90%, 50%, 0.2)', color: 'text-yellow-400' },
    { label: 'الفيديوهات', value: stats.videoCount.toString(), icon: Film, glow: 'hsla(220, 80%, 60%, 0.2)', color: 'text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-[35px] border-b border-white/[0.06] safe-area-top">
        <div className="flex items-center gap-3 px-4 h-12">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="glass-btn w-9 h-9 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-white/70" strokeWidth={1.4} />
          </motion.button>
          <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.4} />
          <h1 className="text-foreground text-base font-semibold">Networkk Cinema Studio</h1>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 max-w-3xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-card p-4 relative z-10 text-center"
              style={{ boxShadow: `0 0 24px ${s.glow}` }}
            >
              <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} strokeWidth={1.4} />
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Upload CTA */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full glass-card p-5 flex items-center justify-center gap-3 relative z-10 text-primary"
          style={{ boxShadow: '0 0 20px hsla(144, 90%, 33%, 0.15)' }}
        >
          <Upload className="w-5 h-5" strokeWidth={1.4} />
          <span className="text-sm font-medium">رفع فيديو جديد</span>
        </motion.button>

        {/* Videos list */}
        <div dir="rtl">
          <h3 className="text-foreground text-sm font-medium mb-3">فيديوهاتك</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="glass-card p-8 text-center relative z-10">
              <Film className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">لم ترفع أي فيديو بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map(v => (
                <motion.div
                  key={v.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/watch/${v.id}`)}
                  className="glass-card flex gap-3 p-3 cursor-pointer relative z-10"
                >
                  <div className="w-28 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.03]">
                    {v.thumbnail_url && <img src={v.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium line-clamp-2">{v.title}</p>
                    <div className="flex gap-3 mt-1.5 text-muted-foreground text-[11px]">
                      <span>{(v.views_count || 0).toLocaleString()} مشاهدة</span>
                      <span>{(v.likes_count || 0).toLocaleString()} إعجاب</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
