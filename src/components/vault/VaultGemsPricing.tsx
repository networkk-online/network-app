import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Gem, Plus, Trash2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const NEON = '#00ff66';

interface Package {
  id: string;
  gems: number;
  price_usd: number;
  bonus_percent: number;
  is_active: boolean;
  featured?: boolean;
}

interface Config {
  base_rate_gems_per_usd: number;
  packages: Package[];
}

const DEFAULTS: Config = {
  base_rate_gems_per_usd: 1000, // 1000 Gems = $1
  packages: [
    { id: 'p1', gems: 1000, price_usd: 1, bonus_percent: 0, is_active: true },
    { id: 'p2', gems: 5500, price_usd: 5, bonus_percent: 10, is_active: true },
    { id: 'p3', gems: 12000, price_usd: 10, bonus_percent: 20, is_active: true, featured: true },
    { id: 'p4', gems: 65000, price_usd: 50, bonus_percent: 30, is_active: true },
  ],
};

export default function VaultGemsPricing() {
  const [config, setConfig] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'gems_pricing').maybeSingle();
      if (data?.value) setConfig({ ...DEFAULTS, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').upsert({
      key: 'gems_pricing',
      value: config as any,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    setSaving(false);
    toast({ title: error ? 'فشل الحفظ' : 'تم حفظ تسعير الجواهر', variant: error ? 'destructive' : 'default' });
  };

  const updatePkg = (id: string, patch: Partial<Package>) =>
    setConfig((c) => ({ ...c, packages: c.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const addPkg = () => setConfig((c) => ({
    ...c,
    packages: [...c.packages, { id: `p${Date.now()}`, gems: 1000, price_usd: 1, bonus_percent: 0, is_active: true }],
  }));

  const removePkg = (id: string) => setConfig((c) => ({ ...c, packages: c.packages.filter((p) => p.id !== id) }));

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NEON }} /></div>;

  const neonBtn = { background: `linear-gradient(135deg, ${NEON}, #00cc52)`, color: '#001a08', boxShadow: `0 0 18px rgba(0,255,102,0.35)` } as const;

  return (
    <div className="space-y-6" dir="rtl">
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Gem className="w-5 h-5" style={{ color: NEON }} />
          <h2 className="text-lg font-bold text-white">تسعير الجواهر (Gems)</h2>
        </div>

        <Card className="p-5 bg-[#0f1422] border-white/[0.06] space-y-4">
          <div>
            <label className="text-xs text-white/60">السعر الأساسي — كم Gems مقابل 1$؟</label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                type="number"
                min={1}
                value={config.base_rate_gems_per_usd}
                onChange={(e) => setConfig({ ...config, base_rate_gems_per_usd: +e.target.value })}
                className="max-w-[180px]"
              />
              <span className="text-white/60 text-sm">Gems = $1</span>
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              مثال: إذا وضعت 1000 يعني 1000 جوهرة = 1$، أي 10,000 جوهرة = 10$.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: NEON }} />
            <h3 className="text-base font-bold text-white">حزم البيع (Packages)</h3>
          </div>
          <Button onClick={addPkg} className="font-bold" style={neonBtn}>
            <Plus className="w-4 h-4 ml-1" /> حزمة جديدة
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {config.packages.map((p) => (
            <Card key={p.id} className="p-4 bg-[#0f1422] border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4" style={{ color: NEON }} />
                  <span className="text-sm font-bold text-white">حزمة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={(v) => updatePkg(p.id, { is_active: v })} />
                  <Button size="sm" variant="destructive" onClick={() => removePkg(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-white/40">عدد الجواهر</label>
                  <Input type="number" value={p.gems} onChange={(e) => updatePkg(p.id, { gems: +e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40">السعر $</label>
                  <Input type="number" step="0.01" value={p.price_usd} onChange={(e) => updatePkg(p.id, { price_usd: +e.target.value })} className="h-9" />
                </div>
                <div>
                  <label className="text-[10px] text-white/40">بونص %</label>
                  <Input type="number" value={p.bonus_percent} onChange={(e) => updatePkg(p.id, { bonus_percent: +e.target.value })} className="h-9" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[11px] text-white/60">
                <Switch checked={!!p.featured} onCheckedChange={(v) => updatePkg(p.id, { featured: v })} />
                <span>حزمة مميّزة (Featured)</span>
              </label>
            </Card>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={saving} className="font-bold" style={neonBtn}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-1" /> حفظ التسعير</>}
      </Button>
    </div>
  );
}
