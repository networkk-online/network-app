import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Radio, Save } from 'lucide-react';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  league: string | null;
  start_time: string;
  status: string;
  stream_url: string | null;
  thumbnail_url: string | null;
  notes: string | null;
}

const empty = {
  home_team: '',
  away_team: '',
  league: '',
  start_time: new Date().toISOString().slice(0, 16),
  status: 'scheduled',
  stream_url: '',
  thumbnail_url: '',
  notes: '',
};

const VaultMatchesManager = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('matches').select('*').order('start_time', { ascending: false });
    setMatches((data as Match[]) || []);
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(empty); setEditingId(null); };

  const save = async () => {
    if (!form.home_team || !form.away_team) {
      toast({ title: 'يرجى إدخال الفريقين', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      home_team: form.home_team,
      away_team: form.away_team,
      league: form.league || null,
      start_time: new Date(form.start_time).toISOString(),
      status: form.status,
      stream_url: form.stream_url || null,
      thumbnail_url: form.thumbnail_url || null,
      notes: form.notes || null,
    };
    const { error } = editingId
      ? await supabase.from('matches').update(payload).eq('id', editingId)
      : await supabase.from('matches').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? '✅ تم تحديث المباراة' : '✅ تمت إضافة المباراة' });
    reset();
    load();
  };

  const edit = (m: Match) => {
    setEditingId(m.id);
    setForm({
      home_team: m.home_team,
      away_team: m.away_team,
      league: m.league || '',
      start_time: new Date(m.start_time).toISOString().slice(0, 16),
      status: m.status,
      stream_url: m.stream_url || '',
      thumbnail_url: m.thumbnail_url || '',
      notes: m.notes || '',
    });
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذه المباراة؟')) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); return; }
    toast({ title: '🗑️ تم الحذف' });
    load();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? 'تعديل مباراة' : 'إضافة مباراة جديدة'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/60 text-xs">الفريق المضيف</Label>
              <Input value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} className="bg-black/40 border-white/10" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">الفريق الضيف</Label>
              <Input value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} className="bg-black/40 border-white/10" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">البطولة / الدوري</Label>
              <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} className="bg-black/40 border-white/10" placeholder="مثل: دوري أبطال أوروبا" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">وقت البداية</Label>
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="bg-black/40 border-white/10" />
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">رابط البث (m3u8 / HLS)</Label>
              <Input value={form.stream_url} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} className="bg-black/40 border-white/10 font-mono text-xs" placeholder="https://.../stream.m3u8" />
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">صورة الغلاف (URL)</Label>
              <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="bg-black/40 border-white/10 font-mono text-xs" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="scheduled">قادمة</SelectItem>
                  <SelectItem value="live">مباشر</SelectItem>
                  <SelectItem value="ended">انتهت</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-black/40 border-white/10 min-h-[60px]" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="bg-[#39FF14] text-black hover:bg-[#39FF14]/90 font-bold">
              <Save className="w-4 h-4 mr-1" /> {editingId ? 'تحديث' : 'إضافة'}
            </Button>
            {editingId && <Button variant="outline" onClick={reset} className="border-white/10">إلغاء</Button>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-white text-base">المباريات ({matches.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matches.length === 0 ? (
            <p className="text-white/30 text-center py-6 text-sm">لا توجد مباريات</p>
          ) : (
            matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{m.home_team} vs {m.away_team}</span>
                    <Badge variant="outline" className={
                      m.status === 'live' ? 'border-red-500/40 text-red-400 bg-red-500/10' :
                      m.status === 'ended' ? 'border-white/20 text-white/40' :
                      'border-[#39FF14]/40 text-[#39FF14] bg-[#39FF14]/10'
                    }>
                      {m.status === 'live' && <Radio className="w-3 h-3 ml-1 animate-pulse" />}
                      {m.status === 'live' ? 'مباشر' : m.status === 'ended' ? 'انتهت' : 'قادمة'}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {m.league || '—'} · {new Date(m.start_time).toLocaleString('ar', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => edit(m)} className="border-white/10 h-8 text-xs">تعديل</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(m.id)} className="border-red-500/30 text-red-400 h-8 px-2">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultMatchesManager;
