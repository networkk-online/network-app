import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Save, CreditCard, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getGatewayLogo } from '@/lib/gatewayLogos';

const NEON = '#00ff66';

type Gateway = {
  id: string; key: string; name_en: string; name_ar: string; icon: string | null;
  is_active: boolean; min_amount: number; max_amount: number; bonus_percent: number;
  instructions_ar: string | null; instructions_en: string | null; sort_order: number;
  barcode_image_url?: string | null;
};

const blankGw = {
  key: '', name_en: '', name_ar: '', icon: '💳',
  min_amount: 1, max_amount: 1000, bonus_percent: 0,
  instructions_ar: '', instructions_en: '',
  is_active: true, sort_order: 100,
};

export default function AdminContentManager() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [about, setAbout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAbout, setSavingAbout] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newGw, setNewGw] = useState({ ...blankGw });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingBarcodeId, setUploadingBarcodeId] = useState<string | null>(null);

  const uploadBarcode = async (g: Gateway, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'يجب اختيار صورة', variant: 'destructive' });
      return;
    }
    setUploadingBarcodeId(g.id);
    const ext = file.name.split('.').pop() || 'png';
    const path = `payment-gateways/${g.key || g.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setUploadingBarcodeId(null);
      toast({ title: 'فشل رفع الباركود', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { data: pub } = supabase.storage.from('covers').getPublicUrl(path);
    const url = pub.publicUrl;
    const { error } = await supabase
      .from('payment_gateways')
      .update({ barcode_image_url: url })
      .eq('id', g.id);
    setUploadingBarcodeId(null);
    if (error) {
      toast({ title: 'فشل حفظ الباركود', description: error.message, variant: 'destructive' });
      return;
    }
    updateLocal(g.id, { barcode_image_url: url });
    toast({ title: 'تم رفع صورة الباركود' });
  };

  const removeBarcode = async (g: Gateway) => {
    const { error } = await supabase
      .from('payment_gateways')
      .update({ barcode_image_url: null })
      .eq('id', g.id);
    if (!error) {
      updateLocal(g.id, { barcode_image_url: null });
      toast({ title: 'تم حذف صورة الباركود' });
    }
  };

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
    } else {
      toast({ title: value ? 'تم تفعيل البوابة' : 'تم تعطيل البوابة' });
    }
  };

  const saveGateway = async (g: Gateway) => {
    setSavingId(g.id);
    const { error } = await supabase.from('payment_gateways').update({
      name_ar: g.name_ar,
      name_en: g.name_en,
      icon: g.icon,
      min_amount: g.min_amount,
      max_amount: g.max_amount,
      bonus_percent: g.bonus_percent,
      instructions_ar: g.instructions_ar,
      instructions_en: g.instructions_en,
    }).eq('id', g.id);
    setSavingId(null);
    toast({ title: error ? 'فشل الحفظ' : 'تم الحفظ', variant: error ? 'destructive' : 'default' });
  };

  const deleteGateway = async (g: Gateway) => {
    if (!confirm(`حذف بوابة "${g.name_ar}" نهائياً؟`)) return;
    setDeletingId(g.id);
    const { error } = await supabase.from('payment_gateways').delete().eq('id', g.id);
    setDeletingId(null);
    if (error) toast({ title: 'فشل الحذف', description: error.message, variant: 'destructive' });
    else {
      setGateways((arr) => arr.filter((x) => x.id !== g.id));
      toast({ title: 'تم حذف البوابة' });
    }
  };

  const createGateway = async () => {
    if (!newGw.name_ar || !newGw.name_en || !newGw.key) {
      toast({ title: 'الاسم والمعرّف مطلوبان', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from('payment_gateways')
      .insert([newGw])
      .select('*')
      .maybeSingle();
    setCreating(false);
    if (error) {
      toast({ title: 'فشل الإنشاء', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) setGateways((arr) => [...arr, data as Gateway].sort((a, b) => a.sort_order - b.sort_order));
    setShowAdd(false);
    setNewGw({ ...blankGw });
    toast({ title: 'تمت إضافة البوابة' });
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: NEON }} />
            <h2 className="text-lg font-bold text-white">إدارة بوابات الدفع</h2>
          </div>
          <Button onClick={() => setShowAdd(true)} className="font-bold" style={neonBtn}>
            <Plus className="w-4 h-4 ml-1" /> إضافة بوابة جديدة
          </Button>
        </div>

        {gateways.length === 0 ? (
          <Card className="p-10 text-center text-white/50 bg-[#0f1422] border-dashed border-white/10">
            لا توجد بوابات. اضغط "إضافة بوابة جديدة" للبدء.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {gateways.map((g) => (
              <Card key={g.id} className="p-4 bg-[#0f1422] border-white/[0.06] space-y-3"
                style={{ boxShadow: g.is_active ? `0 0 18px rgba(0,255,102,0.08)` : undefined }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {(() => {
                      const logo = getGatewayLogo(g.key, g.name_en);
                      return logo ? (
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/10"
                          style={{ background: logo.bg || '#fff' }}
                        >
                          <img src={logo.url} alt={logo.alt} className="max-w-[80%] max-h-[70%] object-contain" />
                        </div>
                      ) : (
                        <Input
                          className="w-14 h-14 text-center text-2xl bg-transparent border-white/10 shrink-0"
                          value={g.icon ?? ''}
                          onChange={(e) => updateLocal(g.id, { icon: e.target.value })}
                        />
                      );
                    })()}
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input className="h-8 text-sm font-bold" value={g.name_ar}
                        onChange={(e) => updateLocal(g.id, { name_ar: e.target.value })} placeholder="الاسم (عربي)" />
                      <Input className="h-7 text-xs text-white/60" value={g.name_en} dir="ltr"
                        onChange={(e) => updateLocal(g.id, { name_en: e.target.value })} placeholder="Name (EN)" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 ms-2 shrink-0">
                    <Switch checked={g.is_active} onCheckedChange={(v) => toggleActive(g, v)} />
                    <span className="text-[9px]" style={{ color: g.is_active ? NEON : 'rgba(255,255,255,0.4)' }}>
                      {g.is_active ? 'مفعّلة' : 'معطّلة'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-white/40">الحد الأدنى $</label>
                    <Input type="number" value={g.min_amount} onChange={(e) => updateLocal(g.id, { min_amount: +e.target.value })} className="h-9" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40">الحد الأقصى $</label>
                    <Input type="number" value={g.max_amount} onChange={(e) => updateLocal(g.id, { max_amount: +e.target.value })} className="h-9" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40">بونص %</label>
                    <Input type="number" value={g.bonus_percent} onChange={(e) => updateLocal(g.id, { bonus_percent: +e.target.value })} className="h-9" />
                  </div>
                </div>

                <Textarea rows={2} placeholder="تعليمات (عربي)" value={g.instructions_ar ?? ''}
                  onChange={(e) => updateLocal(g.id, { instructions_ar: e.target.value })} />
                <Textarea rows={2} placeholder="Instructions (EN)" dir="ltr" value={g.instructions_en ?? ''}
                  onChange={(e) => updateLocal(g.id, { instructions_en: e.target.value })} />

                {/* Barcode / QR image */}
                <div className="rounded-xl border border-white/10 p-3 bg-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/80">صورة الباركود للتحويل</span>
                    {g.barcode_image_url && (
                      <button
                        type="button"
                        onClick={() => removeBarcode(g)}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {g.barcode_image_url ? (
                      <img
                        src={g.barcode_image_url}
                        alt="Barcode"
                        className="w-20 h-20 object-contain rounded-lg bg-white p-1"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-[10px] text-white/40 text-center">
                        لا توجد صورة
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadBarcode(g, f);
                          e.target.value = '';
                        }}
                      />
                      <div
                        className="h-10 rounded-lg flex items-center justify-center text-xs font-bold border border-white/10 hover:bg-white/5 transition"
                        style={{ color: NEON }}
                      >
                        {uploadingBarcodeId === g.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : g.barcode_image_url ? 'تغيير الباركود' : 'رفع صورة الباركود'}
                      </div>
                    </label>
                  </div>
                </div>


                <div className="flex gap-2">
                  <Button onClick={() => saveGateway(g)} disabled={savingId === g.id} className="flex-1 font-bold" style={neonBtn}>
                    {savingId === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ</>}
                  </Button>
                  <Button
                    onClick={() => deleteGateway(g)}
                    disabled={deletingId === g.id}
                    variant="destructive"
                    className="font-bold"
                  >
                    {deletingId === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add Gateway Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#0b0f19] border-white/10 text-white max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: NEON }} />
              إضافة بوابة دفع جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div>
                <label className="text-[10px] text-white/40">الأيقونة</label>
                <Input className="h-12 text-2xl text-center" value={newGw.icon}
                  onChange={(e) => setNewGw({ ...newGw, icon: e.target.value })} placeholder="💳" />
              </div>
              <div>
                <label className="text-[10px] text-white/40">المعرّف (key, إنجليزي بدون مسافات)</label>
                <Input className="h-12" value={newGw.key} dir="ltr"
                  onChange={(e) => setNewGw({ ...newGw, key: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                  placeholder="usdt_trc20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40">الاسم (عربي)</label>
                <Input value={newGw.name_ar} onChange={(e) => setNewGw({ ...newGw, name_ar: e.target.value })} placeholder="مثلاً: تحويل USDT" />
              </div>
              <div>
                <label className="text-[10px] text-white/40">Name (EN)</label>
                <Input dir="ltr" value={newGw.name_en} onChange={(e) => setNewGw({ ...newGw, name_en: e.target.value })} placeholder="USDT Transfer" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-white/40">الحد الأدنى $</label>
                <Input type="number" value={newGw.min_amount} onChange={(e) => setNewGw({ ...newGw, min_amount: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-white/40">الحد الأقصى $</label>
                <Input type="number" value={newGw.max_amount} onChange={(e) => setNewGw({ ...newGw, max_amount: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-white/40">بونص %</label>
                <Input type="number" value={newGw.bonus_percent} onChange={(e) => setNewGw({ ...newGw, bonus_percent: +e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40">تعليمات (عربي)</label>
              <Textarea rows={3} value={newGw.instructions_ar} onChange={(e) => setNewGw({ ...newGw, instructions_ar: e.target.value })}
                placeholder="مثلاً: أرسل المبلغ إلى المحفظة التالية..." />
            </div>
            <div>
              <label className="text-[10px] text-white/40">Instructions (EN)</label>
              <Textarea rows={3} dir="ltr" value={newGw.instructions_en} onChange={(e) => setNewGw({ ...newGw, instructions_en: e.target.value })}
                placeholder="e.g. Send the amount to..." />
            </div>
            <div className="flex items-center justify-between border border-white/10 rounded-lg p-3">
              <span className="text-sm">تفعيل البوابة فور الإنشاء</span>
              <Switch checked={newGw.is_active} onCheckedChange={(v) => setNewGw({ ...newGw, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>إلغاء</Button>
            <Button onClick={createGateway} disabled={creating} className="font-bold" style={neonBtn}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 ml-1" /> إنشاء البوابة</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
