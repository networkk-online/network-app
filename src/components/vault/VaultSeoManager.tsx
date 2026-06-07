import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Search } from 'lucide-react';

interface SeoRow {
  id: string;
  route: string;
  title: string;
  description: string;
  keywords: string;
}

const DEFAULT_ROUTES = ['/', '/welcome', '/network-tv', '/shorts', '/tweets', '/explore', '/recharge', '/add-funds', '/business', '/pages', '/about', '/broadcast'];

const VaultSeoManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [newRoute, setNewRoute] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('seo_meta').select('*').order('route');
    setRows((data as SeoRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, field: keyof SeoRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const save = async (row: SeoRow) => {
    const { error } = await supabase.from('seo_meta').update({
      title: row.title, description: row.description, keywords: row.keywords, updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    if (error) return toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' });
    toast({ title: '✅ تم الحفظ', description: `تحديث الميتا لمسار ${row.route} يظهر فوراً على Google.` });
  };

  const addRoute = async () => {
    const r = newRoute.trim();
    if (!r.startsWith('/')) return toast({ title: 'المسار يجب أن يبدأ بـ /', variant: 'destructive' });
    const { error } = await supabase.from('seo_meta').insert({ route: r, title: '', description: '', keywords: '' });
    if (error) return toast({ title: 'فشل', description: error.message, variant: 'destructive' });
    setNewRoute('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا المسار من إدارة SEO؟')) return;
    await supabase.from('seo_meta').delete().eq('id', id);
    load();
  };

  const visible = rows.filter(r => !filter || r.route.includes(filter));

  return (
    <div className="space-y-4">
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
            <Search className="w-4 h-4" /> إعدادات SEO والكلمات المفتاحية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-white/40">
            أي تعديل يُحفظ هنا يُحقن مباشرة في &lt;head&gt; لكل صفحة عبر react-helmet-async، ويراه Googlebot فوراً بدون إعادة نشر.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Input placeholder="بحث في المسارات..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs bg-black/40 border-white/10 text-white" />
            <div className="flex gap-2 ml-auto">
              <Input placeholder="/new-route" value={newRoute} onChange={(e) => setNewRoute(e.target.value)} className="max-w-xs bg-black/40 border-white/10 text-white" />
              <Button onClick={addRoute} size="sm" className="bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/25">
                <Plus className="w-4 h-4 mr-1" /> إضافة
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-white/30">مسارات مقترحة: {DEFAULT_ROUTES.join(' · ')}</p>
        </CardContent>
      </Card>

      {loading && <p className="text-white/40 text-sm">جاري التحميل...</p>}

      {visible.map(row => (
        <Card key={row.id} className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-white text-sm font-mono">{row.route}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => remove(row.id)} className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => save(row)} className="bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 hover:bg-[#39FF14]/25">
                <Save className="w-4 h-4 mr-1" /> حفظ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-white/60 text-xs">Title (≤ 60 حرف)</Label>
              <Input value={row.title} onChange={(e) => update(row.id, 'title', e.target.value)} className="bg-black/40 border-white/10 text-white" />
              <p className="text-[10px] text-white/30 mt-1">{row.title.length} حرف</p>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Description (≤ 160 حرف)</Label>
              <Textarea value={row.description} onChange={(e) => update(row.id, 'description', e.target.value)} rows={2} className="bg-black/40 border-white/10 text-white" />
              <p className="text-[10px] text-white/30 mt-1">{row.description.length} حرف</p>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Keywords (مفصولة بفواصل)</Label>
              <Textarea value={row.keywords} onChange={(e) => update(row.id, 'keywords', e.target.value)} rows={2} className="bg-black/40 border-white/10 text-white" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VaultSeoManager;
