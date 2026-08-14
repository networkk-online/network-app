import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReasonDialog from './ReasonDialog';
import { adminResolveReport, adminErrorMessage } from '@/lib/adminApi';

const PAGE_SIZE = 15;

const STATUSES = [
  { id: 'pending', label: 'قيد المراجعة' },
  { id: 'reviewed', label: 'تمت المراجعة' },
  { id: 'resolved', label: 'محلولة' },
  { id: 'dismissed', label: 'مرفوضة' },
];

const priorityOf = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('child') || t.includes('safety')) return { label: 'حرجة', cls: 'bg-red-500/15 text-red-400' };
  if (t.includes('violence') || t.includes('abuse') || t.includes('harass')) return { label: 'عالية', cls: 'bg-orange-500/15 text-orange-400' };
  if (t.includes('spam')) return { label: 'منخفضة', cls: 'bg-white/[0.06] text-white/50' };
  return { label: 'متوسطة', cls: 'bg-yellow-500/15 text-yellow-400' };
};

const VaultReports = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [action, setAction] = useState<{ id: string; status: 'resolved' | 'dismissed' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const list = (data || []).slice(0, PAGE_SIZE);
    setHasMore((data || []).length > PAGE_SIZE);
    setRows(list);

    const ids = [...new Set(list.flatMap(r => [r.reporter_id, r.reported_user_id]).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids);
      setNames(Object.fromEntries((profiles || []).map(p => [p.id, p.username || '—'])));
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const resolve = async (reason: string) => {
    if (!action) return;
    const { error } = await adminResolveReport(action.id, action.status, reason);
    if (error) { toast({ title: adminErrorMessage(error.message), variant: 'destructive' }); return; }
    toast({ title: '✅ تم تحديث البلاغ' });
    setAction(null);
    load();
  };

  return (
    <Card className="bg-white/[0.03] border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
          <Flag className="h-4 w-4" /> البلاغات والسلامة
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-3">
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => { setStatus(s.id); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                status === s.id ? 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]' : 'bg-white/[0.03] border-white/10 text-white/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/[0.04]" />)
        ) : rows.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-10">لا توجد بلاغات</p>
        ) : rows.map(r => {
          const p = priorityOf(r.report_type);
          return (
            <div key={r.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={`border-0 text-[11px] ${p.cls}`}>{p.label}</Badge>
                  <span className="text-xs text-white/60">{r.report_type}</span>
                </div>
                <span className="text-[11px] text-white/30">{new Date(r.created_at).toLocaleString('ar-IQ')}</span>
              </div>
              <p className="text-xs text-white/50">
                من <span className="text-white">@{names[r.reporter_id] || '—'}</span>
                {r.reported_user_id && <> ضد <span className="text-red-400">@{names[r.reported_user_id] || '—'}</span></>}
              </p>
              {(r.report_reason || r.additional_details) && (
                <p className="text-xs text-white/70">{r.report_reason} {r.additional_details}</p>
              )}
              {status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => setAction({ id: r.id, status: 'resolved' })} className="bg-[#39FF14]/15 text-[#39FF14] hover:bg-[#39FF14]/25 h-7 text-xs">
                    <Check className="h-3 w-3 ml-1" /> معالجة
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAction({ id: r.id, status: 'dismissed' })} className="text-white/50 h-7 text-xs">
                    <X className="h-3 w-3 ml-1" /> رفض
                  </Button>
                </div>
              )}
            </div>
          );
        })}
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
        open={!!action}
        title={action?.status === 'resolved' ? 'إغلاق البلاغ كمُعالج' : 'رفض البلاغ'}
        description="اكتب ملاحظة داخلية توضح القرار."
        confirmLabel="تأكيد"
        onCancel={() => setAction(null)}
        onConfirm={resolve}
      />
    </Card>
  );
};

export default VaultReports;
