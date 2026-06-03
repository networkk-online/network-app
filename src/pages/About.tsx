import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Languages, Eye, Target, BookOpen, Users, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NEON = '#00ff66';

type AboutRow = {
  title_ar: string; title_en: string;
  intro_ar: string; intro_en: string;
  vision_ar: string; vision_en: string;
  mission_ar: string; mission_en: string;
  story_ar: string; story_en: string;
  team_ar: string; team_en: string;
  stat_users: number; stat_creators: number; stat_countries: number;
};

export default function About() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [data, setData] = useState<AboutRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('about_page_content').select('*').eq('id', 1).maybeSingle();
      if (data) setData(data as AboutRow);
    })();
  }, []);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const pick = (a: string, e: string) => (lang === 'ar' ? a : e);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f19' }}>
        <div className="w-8 h-8 rounded-full border-2 border-white/10 animate-spin" style={{ borderTopColor: NEON }} />
      </div>
    );
  }

  const cards = [
    { icon: Eye, title: pick('رؤيتنا', 'Our Vision'), body: pick(data.vision_ar, data.vision_en) },
    { icon: Target, title: pick('رسالتنا', 'Our Mission'), body: pick(data.mission_ar, data.mission_en) },
    { icon: BookOpen, title: pick('قصة المنصة', 'Our Story'), body: pick(data.story_ar, data.story_en) },
    { icon: Users, title: pick('فريق العمل', 'Our Team'), body: pick(data.team_ar, data.team_en) },
  ];

  const stats = [
    { label: pick('مستخدم', 'Users'), value: data.stat_users },
    { label: pick('صانع محتوى', 'Creators'), value: data.stat_creators },
    { label: pick('دول', 'Countries'), value: data.stat_countries },
  ];

  return (
    <div dir={dir} className="min-h-screen text-white" style={{ background: '#0b0f19' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(circle, ${NEON}, transparent 60%)` }} />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white/60">
          {pick('رجوع', 'Back')}
        </Button>
        <button
          onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'EN' : 'AR'}
        </button>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-5 py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 text-xs"
            style={{ borderColor: 'rgba(0,255,102,0.3)', background: 'rgba(0,255,102,0.06)', color: NEON }}>
            <Globe className="w-3 h-3" /> Networkk
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">{pick(data.title_ar, data.title_en)}</h1>
          <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">{pick(data.intro_ar, data.intro_en)}</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-3 gap-3 mb-12">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 border backdrop-blur-xl text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                borderColor: 'rgba(255,255,255,0.08)',
              }}>
              <div className="text-2xl md:text-3xl font-black" style={{ color: NEON, textShadow: `0 0 24px rgba(0,255,102,0.4)` }}>
                {s.value.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-widest text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Content cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-2xl p-6 border backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{ borderColor: 'rgba(0,255,102,0.25)', background: 'rgba(0,255,102,0.08)' }}>
                  <c.icon className="w-5 h-5" style={{ color: NEON }} />
                </span>
                <h3 className="text-lg font-bold">{c.title}</h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
