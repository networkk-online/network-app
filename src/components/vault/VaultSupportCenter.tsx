import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Save, Plus, Trash2 } from 'lucide-react';

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
      hero_title: row.hero_title,
      hero_subtitle: row.hero_subtitle,
      sections: row.sections || [],
    };
    const { error } = row.id
      ? await supabase.from('support_settings').update(payload).eq('id', row.id)
      : await supabase.from('support_settings').insert([payload]);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved' }); load(); }
  };

  if (!row) return <div className="text-white/40 text-sm">Loading…</div>;

  const sections: any[] = row.sections || [];

  return (
    <Card className="bg-[#0d0d0d]/80 border-white/5">
      <CardHeader>
        <CardTitle className="text-[#00e676] text-sm flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Support Center Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Support Phone</label>
            <Input value={row.support_phone || ''} onChange={e => setRow({ ...row, support_phone: e.target.value })} className="bg-black/40 border-white/10" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">WhatsApp URL</label>
            <Input value={row.whatsapp_url || ''} onChange={e => setRow({ ...row, whatsapp_url: e.target.value })} className="bg-black/40 border-white/10" />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Hero Title</label>
          <Input value={row.hero_title || ''} onChange={e => setRow({ ...row, hero_title: e.target.value })} className="bg-black/40 border-white/10" />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Hero Subtitle</label>
          <Input value={row.hero_subtitle || ''} onChange={e => setRow({ ...row, hero_subtitle: e.target.value })} className="bg-black/40 border-white/10" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/40">Sections</label>
            <Button size="sm" variant="ghost" onClick={() => setRow({ ...row, sections: [...sections, { title: '', body: '' }] })} className="text-[#00e676]"><Plus className="h-3 w-3 mr-1" /> Add</Button>
          </div>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={i} className="p-3 bg-black/30 border border-white/5 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Section title" value={s.title} onChange={e => { const n = [...sections]; n[i] = { ...s, title: e.target.value }; setRow({ ...row, sections: n }); }} className="bg-black/40 border-white/10" />
                  <Button size="sm" variant="ghost" onClick={() => setRow({ ...row, sections: sections.filter((_, j) => j !== i) })} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <Textarea placeholder="Body" value={s.body} onChange={e => { const n = [...sections]; n[i] = { ...s, body: e.target.value }; setRow({ ...row, sections: n }); }} rows={3} className="bg-black/40 border-white/10" />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="bg-[#00e676] hover:bg-[#00e676]/90 text-black font-semibold">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default VaultSupportCenter;
