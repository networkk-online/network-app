import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Fingerprint, Activity, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Bucket { label: string; rows: any[] }

const VaultSecurityCenter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<any[]>([]);
  const [rateEvents, setRateEvents] = useState<any[]>([]);
  const [logins, setLogins] = useState<any[]>([]);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [sec, rl, lh, factors] = await Promise.all([
      supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(30),
      (supabase as any).from('rate_limits').select('*').order('window_start', { ascending: false }).limit(20),
      supabase.from('login_history').select('*').or('is_new_device.eq.true,is_new_ip.eq.true').order('created_at', { ascending: false }).limit(20),
      supabase.auth.mfa.listFactors(),
    ]);
    setFailed((sec.data || []).filter(l => String(l.action_type || '').includes('unauthorized')));
    setRateEvents(rl.data || []);
    setLogins(lh.data || []);
    setMfaFactors(factors.data?.totp || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const revokeOtherSessions = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    toast({
      title: error ? 'تعذر إنهاء الجلسات' : '🔒 تم إنهاء جميع الجلسات الأخرى',
      variant: error ? 'destructive' : undefined,
    });
  };

  const buckets: Bucket[] = [
    { label: 'محاولات وصول مرفوضة', rows: failed },
    { label: 'أحداث تحديد المعدل (Rate limit)', rows: rateEvents },
    { label: 'دخول من جهاز/IP جديد', rows: logins },
  ];

  if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/[0.04]" />)}</div>;

  return (
    <div className="space-y-4">
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#39FF14] text-base flex items-center gap-2">
            <Fingerprint className="h-4 w-4" /> جلستي والمصادقة الثنائية
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4 text-white/50" /></Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <p className="text-sm text-white">عوامل TOTP المسجّلة</p>
              <p className="text-xs text-white/40">{mfaFactors.length ? `${mfaFactors.length} عامل نشط` : 'لا يوجد عامل مسجّل'}</p>
            </div>
            <Badge className={`border-0 ${mfaFactors.some(f => f.status === 'verified') ? 'bg-[#39FF14]/15 text-[#39FF14]' : 'bg-red-500/15 text-red-400'}`}>
              {mfaFactors.some(f => f.status === 'verified') ? 'مُفعّل' : 'غير مُفعّل'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20">
            <div>
              <p className="text-sm text-white">إنهاء جميع الجلسات الأخرى</p>
              <p className="text-xs text-white/40">إجراء طارئ يقطع كل الأجهزة الأخرى فوراً</p>
            </div>
            <Button size="sm" onClick={revokeOtherSessions} className="bg-red-600 hover:bg-red-700 text-white">تنفيذ</Button>
          </div>
        </CardContent>
      </Card>

      {buckets.map(b => (
        <Card key={b.label} className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              {b.label.includes('مرفوضة') ? <ShieldAlert className="h-4 w-4 text-red-400" /> : <Activity className="h-4 w-4 text-white/40" />}
              {b.label}
              <span className="text-[11px] text-white/30">({b.rows.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-72 overflow-y-auto">
            {b.rows.length === 0 ? (
              <p className="text-xs text-white/25 py-4 text-center">لا توجد أحداث</p>
            ) : b.rows.map((r, i) => (
              <div key={r.id || i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-white/60 flex justify-between gap-2">
                <span className="truncate">
                  {r.action_type || r.bucket || r.device_label || 'event'}
                  {r.ip_address && <span className="text-white/30"> · {r.ip_address}</span>}
                  {r.identifier && <span className="text-white/30"> · {r.identifier}</span>}
                  {typeof r.hits === 'number' && <span className="text-white/30"> · {r.hits} محاولة</span>}
                </span>
                <span className="text-white/25 shrink-0">
                  {new Date(r.created_at || r.window_start).toLocaleString('ar-IQ')}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VaultSecurityCenter;
