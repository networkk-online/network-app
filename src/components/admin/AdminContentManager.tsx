import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, CreditCard, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const NEON = '#00ff66';

type Gateway = {
  id: string; key: string; name_en: string; name_ar: string; icon: string | null;
  is_active: boolean; min_amount: number; max_amount: number; bonus_percent: number;
  instructions_ar: string | null; instructions_en: string | null; sort_order: number;
};

export default function AdminContentManager() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [about, setAbout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAbout, setSavingAbout] = useState(false);

  const load = async () => {
    const [g, a] = await Promise.all([
      supabase.from('payment_gateways').select('*').order('sort_order'),
      supabase.from('about_page_content').select('*').eq('id', 1).maybeSingle(),
    ]);
    setGateways((g.data as Gateway[]) ?? []);
    setAbout(a.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateLocal = (id: string, patch: Partial<Gateway>) =>
    setGateways((g) => g.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const toggleActive = async (g: Gateway, value: boolean) => {
    updateLocal(g.id, { is_active: value });
    const { error } = await supabase.from('payment_gateways').update({ is_active: value }).eq('id', g.id);
    if (error) {
      updateLocal(g.id, { is_active: !value });
      toast({ title: 'فشل التحديث', variant: 'destructive' });
    }
  };

  const saveGateway = async (g: Gateway) => {
    setSavingId(g.id);
    const { error } = await supabase.from('payment_gateways').update({
      min_amount: g.min_amount,
      max_amount: g.max_amount,
      bonus_percent: g.bonus_percent,
      instructions_ar: g.instructions_ar,
      instructions_en: g.instructions_en,
    }).eq('id', g.id);
    setSavingId(null);
    toast({ title: error ? 'فشل الحفظ' : 'تم الحفظ', variant: error ? 'destructive' : 'default' });
  };

  const saveAbout = async () => {
    if (!about) return;
    setSavingAbout(true);
    const { id, updated_at, ...rest } = about;
    const { error } = await supabase.from('about_page_content').update(rest).eq('id', 1);
    setSavingAbout(false);
    toast({ title: error ? 'فشل الحفظ' : 'تم تحديث صفحة من نحن', variant: error ? 'destructive' : 'default' });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NEON }} /></div>;
  }

  const neonBtn = {
    background: `linear-gradient(135deg, ${NEON}, #00cc52)`,
    color: '#001a08',
    boxShadow: `0 0 18px rgba(0,255,102,0.35)`,
  } as const;

  return (
    <div className="space-y-8" dir="rtl">
      {/* About editor */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" style={{ color: NEON }} />
          <h2 className="text-lg font-bold text-white">تعديل صفحة "من نحن"</h2>
        </div>
        {about && (
          <Card className="p-5 bg-[#0f1422] border-white/[0.06] space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Input value={about.title_ar} onChange={(e) => setAbout({ ...about, title_ar: e.target.value })} placeholder="العنوان (عربي)" />
              <Input value={about.title_en} onChange={(e) => setAbout({ ...about, title_en: e.target.value })} placeholder="Title (EN)" dir="ltr" />
              <Textarea value={about.intro_ar} onChange={(e) => setAbout({ ...about, intro_ar: e.target.value })} placeholder="مقدمة (عربي)" />
              <Textarea value={about.intro_en} onChange={(e) => setAbout({ ...about, intro_en: e.target.value })} placeholder="Intro (EN)" dir="ltr" />
              <Textarea value={about.vision_ar} onChange={(e) => setAbout({ ...about, vision_ar: e.target.value })} placeholder="الرؤية (عربي)" />
              <Textarea value={about.vision_en} onChange={(e) => setAbout({ ...about, vision_en: e.target.value })} placeholder="Vision (EN)" dir="ltr" />
              <Textarea value={about.mission_ar} onChange={(e) => setAbout({ ...about, mission_ar: e.target.value })} placeholder="الرسالة (عربي)" />
              <Textarea value={about.mission_en} onChange={(e) => setAbout({ ...about, mission_en: e.target.value })} placeholder="Mission (EN)" dir="ltr" />
              <Textarea value={about.story_ar} onChange={(e) => setAbout({ ...about, story_ar: e.target.value })} placeholder="القصة (عربي)" />
              <Textarea value={about.story_en} onChange={(e) => setAbout({ ...about, story_en: e.target.value })} placeholder="Story (EN)" dir="ltr" />
              <Textarea value={about.team_ar} onChange={(e) => setAbout({ ...about, team_ar: e.target.value })} placeholder="الفريق (عربي)" />
              <Textarea value={about.team_en} onChange={(e) => setAbout({ ...about, team_en: e.target.value })} placeholder="Team (EN)" dir="ltr" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" value={about.stat_users} onChange={(e) => setAbout({ ...about, stat_users: +e.target.value })} placeholder="مستخدمين" />
              <Input type="number" value={about.stat_creators} onChange={(e) => setAbout({ ...about, stat_creators: +e.target.value })} placeholder="صنّاع" />
              <Input type="number" value={about.stat_countries} onChange={(e) => setAbout({ ...about, stat_countries: +e.target.value })} placeholder="دول" />
            </div>
            <Button onClick={saveAbout} disabled={savingAbout} className="font-bold" style={neonBtn}>
              {savingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ التعديلات</>}
            </Button>
          </Card>
        )}
      </section>

      {/* Payment gateways */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5" style={{ color: NEON }} />
          <h2 className="text-lg font-bold text-white">إدارة طرق الدفع</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {gateways.map((g) => (
            <Card key={g.id} className="p-4 bg-[#0f1422] border-white/[0.06] space-y-3"
              style={{ boxShadow: g.is_active ? `0 0 18px rgba(0,255,102,0.08)` : undefined }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <div className="font-bold text-white">{g.name_ar}</div>
                    <div className="text-xs text-white/40">{g.name_en}</div>
                  </div>
                </div>
                <Switch checked={g.is_active} onCheckedChange={(v) => toggleActive(g, v)} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-white/40">الحد الأدنى</label>
                  <Input type="number" value={g.min_amount} onChange={(e) => updateLocal(g.id, { min_amount: +e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40">الحد الأقصى</label>
                  <Input type="number" value={g.max_amount} onChange={(e) => updateLocal(g.id, { max_amount: +e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40">بونص %</label>
                  <Input type="number" value={g.bonus_percent} onChange={(e) => updateLocal(g.id, { bonus_percent: +e.target.value })} className="h-9" />
                </div>
              </div>

              <Textarea
                rows={2}
                placeholder="تعليمات (عربي)"
                value={g.instructions_ar ?? ''}
                onChange={(e) => updateLocal(g.id, { instructions_ar: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Instructions (EN)"
                dir="ltr"
                value={g.instructions_en ?? ''}
                onChange={(e) => updateLocal(g.id, { instructions_en: e.target.value })}
              />

              <Button onClick={() => saveGateway(g)} disabled={savingId === g.id} className="w-full font-bold" style={neonBtn}>
                {savingId === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ الإعدادات</>}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
