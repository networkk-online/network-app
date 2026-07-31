import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Trash2, UserCog, Loader2 } from 'lucide-react';

interface Plan {
  id: string; name: string; name_ar: string; tagline_ar: string | null;
  price_usd: number; price_yearly_usd: number | null; accent: string;
  badge_color: string | null; sort_order: number; is_active: boolean; is_public: boolean;
}
interface Feature { key: string; name: string; name_ar: string; category: string; }
interface Entitlement { plan_id: string; feature_key: string; enabled: boolean; limit_value: number | null; }

const emptyPlan: Plan = {
  id: '', name: '', name_ar: '', tagline_ar: '', price_usd: 0, price_yearly_usd: 0,
  accent: '#08A045', badge_color: '#08A045', sort_order: 10, is_active: true, is_public: true,
};

const VaultSubscriptions = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [ents, setEnts] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlan, setNewPlan] = useState<Plan>(emptyPlan);
  const [newFeature, setNewFeature] = useState({ key: '', name: '', name_ar: '', category: 'general' });
  const [userQuery, setUserQuery] = useState('');
  const [assignPlan, setAssignPlan] = useState('personal');
  const [months, setMonths] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, f, e] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('sort_order'),
      supabase.from('plan_features').select('*').order('sort_order'),
      supabase.from('plan_entitlements').select('plan_id,feature_key,enabled,limit_value'),
    ]);
    setPlans((p.data as Plan[]) || []);
    setFeatures((f.data as Feature[]) || []);
    setEnts((e.data as Entitlement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isOn = (planId: string, key: string) =>
    ents.some((x) => x.plan_id === planId && x.feature_key === key && x.enabled);

  const toggleEntitlement = async (planId: string, key: string) => {
    const on = isOn(planId, key);
    if (on) {
      await supabase.from('plan_entitlements').delete().eq('plan_id', planId).eq('feature_key', key);
      setEnts((prev) => prev.filter((x) => !(x.plan_id === planId && x.feature_key === key)));
    } else {
      const { error } = await supabase.from('plan_entitlements')
        .upsert({ plan_id: planId, feature_key: key, enabled: true }, { onConflict: 'plan_id,feature_key' });
      if (error) { toast({ title: 'فشل التحديث', description: error.message, variant: 'destructive' }); return; }
      setEnts((prev) => [...prev, { plan_id: planId, feature_key: key, enabled: true, limit_value: null }]);
    }
  };

  const savePlan = async (plan: Plan) => {
    setSaving(true);
    const { error } = await supabase.from('subscription_plans').upsert(plan as any);
    setSaving(false);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    toast({ title: 'تم الحفظ', description: `تم تحديث باقة ${plan.name_ar}` });
    load();
  };

  const addPlan = async () => {
    if (!newPlan.id.trim() || !newPlan.name_ar.trim()) {
      return toast({ title: 'أدخل معرف واسم الباقة', variant: 'destructive' });
    }
    await savePlan({ ...newPlan, id: newPlan.id.trim().toLowerCase() });
    setNewPlan(emptyPlan);
  };

  const deletePlan = async (id: string) => {
    if (id === 'free') return toast({ title: 'لا يمكن حذف الباقة المجانية', variant: 'destructive' });
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    load();
  };

  const addFeature = async () => {
    if (!newFeature.key.trim() || !newFeature.name_ar.trim()) {
      return toast({ title: 'أدخل معرف واسم الميزة', variant: 'destructive' });
    }
    const { error } = await supabase.from('plan_features').insert({
      ...newFeature, key: newFeature.key.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newFeature.name || newFeature.name_ar,
    });
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    setNewFeature({ key: '', name: '', name_ar: '', category: 'general' });
    load();
  };

  const assignSubscription = async () => {
    const q = userQuery.trim();
    if (!q) return;
    setSaving(true);
    let userId = q;
    if (!/^[0-9a-f-]{36}$/i.test(q)) {
      const { data } = await supabase.from('profiles').select('id').ilike('username', q.replace(/^@/, '')).maybeSingle();
      if (!data) { setSaving(false); return toast({ title: 'المستخدم غير موجود', variant: 'destructive' }); }
      userId = data.id;
    }
    const { data, error } = await supabase.rpc('admin_set_subscription', {
      _user_id: userId, _plan_id: assignPlan, _billing_cycle: 'monthly', _months: months,
    });
    setSaving(false);
    const res = data as any;
    if (error || !res?.success) {
      return toast({ title: 'فشل التفعيل', description: error?.message || res?.error, variant: 'destructive' });
    }
    toast({ title: 'تم التفعيل', description: `الباقة: ${assignPlan}` });
    setUserQuery('');
  };

  const runSweeper = async () => {
    const { data, error } = await supabase.rpc('expire_subscriptions');
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    toast({ title: 'تمت المعالجة', description: `تم إرجاع ${data ?? 0} حساب للخطة المجانية` });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#39FF14]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl" dir="rtl">
      {/* Assign subscription */}
      <Card className="bg-black/60 border-[#39FF14]/15">
        <CardHeader><CardTitle className="text-sm text-[#39FF14] flex items-center gap-2"><UserCog className="w-4 h-4" /> تفعيل اشتراك لمستخدم</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="اسم المستخدم أو المعرف" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="sm:col-span-2 bg-white/5 border-white/10" />
          <select value={assignPlan} onChange={(e) => setAssignPlan(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white">
            {plans.map((p) => <option key={p.id} value={p.id} className="bg-black">{p.name_ar}</option>)}
          </select>
          <div className="flex gap-2">
            <Input type="number" min={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-20 bg-white/5 border-white/10" />
            <Button onClick={assignSubscription} disabled={saving} className="flex-1">تفعيل</Button>
          </div>
          <Button variant="outline" size="sm" onClick={runSweeper} className="sm:col-span-4 border-white/10">تشغيل مُنهي الاشتراكات المنتهية</Button>
        </CardContent>
      </Card>

      {/* Plans */}
      <Card className="bg-black/60 border-[#39FF14]/15">
        <CardHeader><CardTitle className="text-sm text-[#39FF14]">الباقات</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {plans.map((plan, idx) => (
            <div key={plan.id} className="rounded-xl border border-white/10 p-3 grid gap-2 sm:grid-cols-6 items-center">
              <span className="text-xs font-mono text-white/40">{plan.id}</span>
              <Input value={plan.name_ar} onChange={(e) => setPlans((p) => p.map((x, i) => i === idx ? { ...x, name_ar: e.target.value } : x))} className="bg-white/5 border-white/10" />
              <Input value={plan.name} onChange={(e) => setPlans((p) => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="bg-white/5 border-white/10" />
              <Input type="number" value={plan.price_usd} onChange={(e) => setPlans((p) => p.map((x, i) => i === idx ? { ...x, price_usd: Number(e.target.value) } : x))} className="bg-white/5 border-white/10" />
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Switch checked={plan.is_public} onCheckedChange={(v) => setPlans((p) => p.map((x, i) => i === idx ? { ...x, is_public: v } : x))} />
                ظاهرة
                <Switch checked={plan.is_active} onCheckedChange={(v) => setPlans((p) => p.map((x, i) => i === idx ? { ...x, is_active: v } : x))} />
                مفعلة
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => savePlan(plan)} disabled={saving}><Save className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-[#39FF14]/20 p-3 grid gap-2 sm:grid-cols-5 items-center">
            <Input placeholder="المعرف (id)" value={newPlan.id} onChange={(e) => setNewPlan({ ...newPlan, id: e.target.value })} className="bg-white/5 border-white/10" />
            <Input placeholder="الاسم بالعربية" value={newPlan.name_ar} onChange={(e) => setNewPlan({ ...newPlan, name_ar: e.target.value })} className="bg-white/5 border-white/10" />
            <Input placeholder="Name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} className="bg-white/5 border-white/10" />
            <Input type="number" placeholder="السعر $" value={newPlan.price_usd} onChange={(e) => setNewPlan({ ...newPlan, price_usd: Number(e.target.value) })} className="bg-white/5 border-white/10" />
            <Button onClick={addPlan} className="gap-1"><Plus className="w-4 h-4" /> إضافة باقة</Button>
          </div>
        </CardContent>
      </Card>

      {/* Entitlements matrix */}
      <Card className="bg-black/60 border-[#39FF14]/15">
        <CardHeader><CardTitle className="text-sm text-[#39FF14]">مصفوفة الصلاحيات</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40">
                <th className="text-right p-2">الميزة</th>
                {plans.map((p) => <th key={p.id} className="p-2 whitespace-nowrap">{p.name_ar}</th>)}
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.key} className="border-t border-white/5">
                  <td className="p-2 text-white/70">{f.name_ar} <span className="text-white/25 font-mono text-[10px]">{f.key}</span></td>
                  {plans.map((p) => (
                    <td key={p.id} className="p-2 text-center">
                      <Switch checked={isOn(p.id, f.key)} onCheckedChange={() => toggleEntitlement(p.id, f.key)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <Input placeholder="feature_key" value={newFeature.key} onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value })} className="bg-white/5 border-white/10" />
            <Input placeholder="الاسم بالعربية" value={newFeature.name_ar} onChange={(e) => setNewFeature({ ...newFeature, name_ar: e.target.value })} className="bg-white/5 border-white/10" />
            <Input placeholder="التصنيف" value={newFeature.category} onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })} className="bg-white/5 border-white/10" />
            <Button onClick={addFeature} className="gap-1"><Plus className="w-4 h-4" /> إضافة ميزة</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultSubscriptions;
