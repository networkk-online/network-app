import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, ExternalLink } from 'lucide-react';

interface SitePage {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_description: string;
}

const VaultPagesContent = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [selected, setSelected] = useState<SitePage | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('site_pages').select('*').order('slug');
    setPages((data || []) as any);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from('site_pages')
      .update({ title: selected.title, body: selected.body, meta_description: selected.meta_description })
      .eq('id', selected.id);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved' }); load(); }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-[#0d0d0d]/80 border-white/5 md:col-span-1">
        <CardHeader>
          <CardTitle className="text-[#00e676] text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Site Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto">
          {pages.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selected?.id === p.id ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30' : 'text-white/60 hover:bg-white/5'}`}>
              <div className="font-medium">{p.title}</div>
              <div className="text-[10px] text-white/30 font-mono">/{p.slug}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[#0d0d0d]/80 border-white/5 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#00e676] text-sm">{selected ? `Edit: ${selected.slug}` : 'Select a page'}</CardTitle>
          {selected && <a href={`/${selected.slug}`} target="_blank" rel="noreferrer" className="text-xs text-white/40 hover:text-[#00e676] flex items-center gap-1"><ExternalLink className="h-3 w-3" /> View</a>}
        </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Title</label>
                <Input value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })} className="bg-black/40 border-white/10" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Meta Description</label>
                <Input value={selected.meta_description || ''} onChange={e => setSelected({ ...selected, meta_description: e.target.value })} className="bg-black/40 border-white/10" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Body</label>
                <Textarea value={selected.body} onChange={e => setSelected({ ...selected, body: e.target.value })} rows={14} className="bg-black/40 border-white/10 font-mono text-sm" />
              </div>
              <Button onClick={save} disabled={saving} className="bg-[#00e676] hover:bg-[#00e676]/90 text-black font-semibold">
                <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <p className="text-white/30 text-sm py-12 text-center">Pick a page from the list to edit its content.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultPagesContent;
