import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Clock, RefreshCw } from 'lucide-react';

interface VerificationLog {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  verification_type: string | null;
  notes: string | null;
  created_at: string;
  admin_profile?: { username: string | null; full_name: string | null };
  target_profile?: { username: string | null; full_name: string | null };
}

const AdminAuditTab = () => {
  const [logs, setLogs] = useState<VerificationLog[]>([]);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('verification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data && data.length > 0) {
      const allIds = [...new Set([...data.map(l => l.admin_id), ...data.map(l => l.target_user_id)])];
      const { data: profiles } = await supabase.from('profiles').select('id, username, full_name').in('id', allIds);
      const enriched = data.map(log => ({
        ...log,
        admin_profile: profiles?.find(p => p.id === log.admin_id),
        target_profile: profiles?.find(p => p.id === log.target_user_id),
      }));
      setLogs(enriched as VerificationLog[]);
    } else {
      setLogs([]);
    }
  };

  const getActionLabel = (action: string) => {
    if (action.includes('removed')) return 'أزال التحقق عن';
    if (action.includes('verified')) return 'وثّق حساب';
    if (action.includes('deleted_post')) return 'حذف منشور';
    if (action.includes('deleted_reel')) return 'حذف ريلز';
    if (action.includes('deleted_comment')) return 'حذف تعليق';
    return action;
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'business': return 'حساب تجاري';
      case 'notable': return 'شخصية بارزة';
      case 'government': return 'جهة حكومية';
      default: return '';
    }
  };

  return (
    <Card className="bg-[#111] border-border/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> سجل المراجعة
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={loadLogs}><RefreshCw className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد سجلات بعد</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-border/10">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-medium text-primary">@{log.admin_profile?.username || 'admin'}</span>
                    {' '}{getActionLabel(log.action)}{' '}
                    <span className="font-medium text-blue-400">@{log.target_profile?.username || 'user'}</span>
                    {log.verification_type && <span className="text-muted-foreground"> كـ {getTypeLabel(log.verification_type)}</span>}
                  </p>
                  {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(log.created_at).toLocaleString('ar-IQ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAuditTab;
