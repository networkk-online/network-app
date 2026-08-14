import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileLock2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 25;

interface AuditRow {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  target_user_id: string | null;
  reason: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const VaultAuditLog = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let req = (supabase as any)
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    if (query.trim()) req = req.ilike('action', `%${query.trim()}%`);

    const { data } = await req;
    const list: AuditRow[] = (data || []).slice(0, PAGE_SIZE);
    setHasMore((data || []).length > PAGE_SIZE);
    setRows(list);

    // Batch profile lookup (no N+1).
    const ids = [...new Set(list.flatMap(r => [r.admin_id, r.target_user_id]).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids);
      setNames(Object.fromEntries((profiles || []).map(p => [p.id, p.username || '—'])));
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="bg-white/[0.03] border-white/[0.08]">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
          <FileLock2 className="h-4 w-4" /> سجل التدقيق (غير قابل للتعديل)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => { setPage(0); setQuery(e.target.value); }}
            placeholder="بحث بالإجراء…"
            className="h-8 w-40 bg-white/[0.04] border-white/10 text-white text-xs"
          />
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4 text-white/50" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 bg-white/[0.04]" />)
        ) : rows.length === 0 ? (
          <p className="text-center text-white/30 text-sm py-10">لا توجد سجلات</p>
        ) : (
          rows.map(r => (
            <div key={r.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge className="bg-[#39FF14]/10 text-[#39FF14] border-0 text-[11px]">{r.action}</Badge>
                <span className="text-[11px] text-white/30">{new Date(r.created_at).toLocaleString('ar-IQ')}</span>
              </div>
              <p className="text-xs text-white/60 mt-2">
                بواسطة <span className="text-white">@{names[r.admin_id] || r.admin_id.slice(0, 8)}</span>
                {r.target_user_id && <> على <span className="text-blue-400">@{names[r.target_user_id] || r.target_user_id.slice(0, 8)}</span></>}
                {r.resource_type && <span className="text-white/30"> — {r.resource_type}</span>}
              </p>
              {r.reason && <p className="text-[11px] text-white/40 mt-1">السبب: {r.reason}</p>}
              {r.ip_address && <p className="text-[11px] text-white/25 mt-0.5">IP: {r.ip_address}</p>}
            </div>
          ))
        )}
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
    </Card>
  );
};

export default VaultAuditLog;
