import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Save, Plus, Trash2, ExternalLink } from 'lucide-react';

const PUBLIC_API = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/support-content`;

const VaultSupportCenter = () => {
  const { toast } = useToast();
  const [row, setRow] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('support_settings').select('*').limit(1).maybeSingle();
    setRow(data || { support_phone: '', whatsapp_url: '', hero_title: '', hero_subtitle: '', sections: [] });
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!row) return;
    setSaving(true);
    const payload = {
      support_phone: row.support_phone,
      whatsapp_url: row.whatsapp_url,
      call_url: row.call_url,
      hero_title: row.hero_title,
      hero_subtitle: row.hero_subtitle,
      sections: row.sections || [],
    };
    const { error } = row.id
      ? await supabase.from('support_settings').update(payload).eq('id', row.id)
      : await supabase.from('support_settings').insert([payload]);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'تم الحفظ — التحديث مباشر على support.networkk.online' }); load(); }
  };

  if (!row) return <div className="text-white/40 text-sm">Loading…</div>;

  const sections: any[] = row.sections || [];
  const updateSection = (i: number, patch: any) => {
    const n = [...sections]; n[i] = { ...sections[i], ...patch }; setRow({ ...row, sections: n });
  };

  return (
    <Card className="bg-[#0d0d0d]/80 border-white/5">
      <CardHeader>
        <CardTitle className="text-[#00e676] text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> مركز الدعم — التحكم المباشر</span>
          <a href={PUBLIC_API} target="_blank" rel="noreferrer" className="text-[10px] text-white/30 hover:text-[#00e676] flex items-center gap-1 font-mono">
            API <ExternalLink className="h-3 w-3" />
          </a>
        </CardTitle>
        <p className="text-[11px] text-white/40 mt-1">
          أي تعديل يُحفظ هنا يظهر فورياً على <span className="text-[#00e676] font-mono">support.networkk.online</span> عبر طبقة قاعدة بيانات مشتركة، بدون إعادة نشر.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">رقم الدعم الفني</label>
            <Input dir="ltr" value={row.support_phone || ''} onChange={e => setRow({ ...row, support_phone: e.target.value })} className="bg-black/40 border-white/10" placeholder="07737318706" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">رابط زر "اتصل الآن" (اختياري — افتراضياً tel:phone)</label>
            <Input dir="ltr" value={row.call_url || ''} onChange={e => setRow({ ...row, call_url: e.target.value })} className="bg-black/40 border-white/10" placeholder="tel:+9647737318706" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/40 mb-1 block">رابط زر واتساب</label>
            <Input dir="ltr" value={row.whatsapp_url || ''} onChange={e => setRow({ ...row, whatsapp_url: e.target.value })} className="bg-black/40 border-white/10" placeholder="https://wa.me/9647737318706" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">عنوان الصفحة الرئيسي</label>
            <Input value={row.hero_title || ''} onChange={e => setRow({ ...row, hero_title: e.target.value })} className="bg-black/40 border-white/10" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">الوصف الفرعي</label>
            <Input value={row.hero_subtitle || ''} onChange={e => setRow({ ...row, hero_subtitle: e.target.value })} className="bg-black/40 border-white/10" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40">البطاقات (الأقسام)</label>
            <Button size="sm" variant="ghost" onClick={() => setRow({ ...row, sections: [...sections, { category: '', title: '', description: '', body: '' }] })} className="text-[#00e676]">
              <Plus className="h-3 w-3 mr-1" /> إضافة بطاقة
            </Button>
          </div>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="p-3 bg-black/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="التصنيف (مثال: المدفوعات)" value={s.category || ''} onChange={e => updateSection(i, { category: e.target.value })} className="bg-black/40 border-white/10 w-40" />
                  <Input placeholder="عنوان البطاقة (مثال: نظام الجواهر والدفع الإلكتروني)" value={s.title || ''} onChange={e => updateSection(i, { title: e.target.value })} className="bg-black/40 border-white/10" />
                  <Button size="sm" variant="ghost" onClick={() => setRow({ ...row, sections: sections.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Input placeholder="وصف قصير يظهر تحت العنوان" value={s.description || ''} onChange={e => updateSection(i, { description: e.target.value })} className="bg-black/40 border-white/10" />
                <Textarea placeholder="المحتوى التفصيلي" value={s.body || ''} onChange={e => updateSection(i, { body: e.target.value })} rows={3} className="bg-black/40 border-white/10" />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="bg-[#00e676] hover:bg-[#00e676]/90 text-black font-semibold">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'جاري الحفظ…' : 'حفظ التغييرات (مباشر)'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VaultSupportCenter;
