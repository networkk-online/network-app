import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReasonDialog from './ReasonDialog';
import { adminDeleteContent, adminErrorMessage, ModerationResource } from '@/lib/adminApi';

const PAGE_SIZE = 12;

const TABS: { id: ModerationResource; label: string; table: string; preview: (r: any) => string }[] = [
  { id: 'post', label: 'المنشورات', table: 'posts', preview: (r) => r.content || r.media_url || '' },
  { id: 'reel', label: 'الريلز', table: 'reels', preview: (r) => r.caption || r.video_url || '' },
  { id: 'story', label: 'الستوري', table: 'stories', preview: (r) => r.media_url || '' },
  { id: 'comment', label: 'التعليقات', table: 'comments', preview: (r) => r.content || '' },
];

const VaultModeration = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<ModerationResource>('post');
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [target, setTarget] = useState<any | null>(null);

  const active = TABS.find(t => t.id === tab)!;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from(active.table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const list = (data || []).slice(0, PAGE_SIZE);
    setHasMore((data || []).length > PAGE_SIZE);
    setRows(list);

    const ids = [...new Set(list.map((r: any) => r.user_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids);
      setNames(Object.fromEntries((profiles || []).map(p => [p.id, p.username || '—'])));
    }
    setLoading(false);
  }, [active.table, page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (reason: string) => {
    const { error } = await adminDeleteContent(tab, target.id, reason);
    if (error) {
      toast({ title: adminErrorMessage(error.message), variant: 'destructive' });
      return;
    }
    toast({ title: '🗑️ تم حذف المحتوى وتسجيل الإجراء' });
    setTarget(null);
    load();
  };

  return (
    <Card className="bg-white/[0.03] border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
          <Shield className="h-4 w-4" /> الإشراف على المحتوى
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                tab === t.id ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/[0.03] border-white/10 text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/[0.04]" />)
        ) : rows.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-10">لا يوجد محتوى</p>
        ) : rows.map(r => (
          <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/50">@{names[r.user_id] || '—'} · {new Date(r.created_at).toLocaleString('ar-IQ')}</p>
              <p className="text-sm text-white/80 truncate mt-1">{active.preview(r) || '—'}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTarget(r)} className="text-red-400 hover:text-red-300 shrink-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-white/50">
            <ChevronRight className="h-4 w-4" /> السابق
          </Button>
          <span className="text-[11px] text-white/30">صفحة {page + 1}</span>
          <Button size="sm" variant="ghost" disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="text-white/50">
            التالي <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <ReasonDialog
        open={!!target}
        title="حذف المحتوى نهائياً"
        description="لا يمكن التراجع عن هذا الإجراء. اكتب سبب الإشراف."
        confirmLabel="حذف"
        onCancel={() => setTarget(null)}
        onConfirm={remove}
      />
    </Card>
  );
};

export default VaultModeration;
