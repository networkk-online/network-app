import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shield, Clock, Globe, Search, Ban, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VaultSecurityAudit = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bannedIPs, setBannedIPs] = useState<string[]>([]);
  const [newBanIP, setNewBanIP] = useState('');

  useEffect(() => { loadLogs(); loadBannedIPs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  const loadBannedIPs = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'banned_ips').single();
    if (data) setBannedIPs((data.value as any)?.ips || []);
  };

  const banIP = async (ip: string) => {
    if (!ip.trim() || bannedIPs.includes(ip)) return;
    const updated = [...bannedIPs, ip.trim()];
    await supabase.from('app_settings').upsert({ key: 'banned_ips', value: { ips: updated }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setBannedIPs(updated);
    setNewBanIP('');
    toast({ title: `🚫 تم حظر IP: ${ip}` });
  };

  const unbanIP = async (ip: string) => {
    const updated = bannedIPs.filter(i => i !== ip);
    await supabase.from('app_settings').upsert({ key: 'banned_ips', value: { ips: updated }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setBannedIPs(updated);
    toast({ title: `✅ تم رفع الحظر عن: ${ip}` });
  };

  const filtered = searchQuery.trim()
    ? logs.filter(l => l.action_type?.includes(searchQuery) || l.ip_address?.includes(searchQuery) || l.attempted_route?.includes(searchQuery))
    : logs;

  const getActionColor = (type: string) => {
    if (type?.includes('unauthorized') || type?.includes('block')) return 'text-red-400 bg-red-500/10';
    if (type?.includes('login')) return 'text-yellow-400 bg-yellow-500/10';
    if (type?.includes('approved')) return 'text-[#39FF14] bg-[#39FF14]/10';
    return 'text-white/40 bg-white/[0.04]';
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 bg-white/[0.04]" />)}</div>;

  return (
    <div className="space-y-6">
      {/* IP Ban Section */}
      <Card className="bg-white/[0.03] border-red-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-400 text-sm flex items-center gap-2"><Ban className="w-4 h-4" /> حظر IP ({bannedIPs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input value={newBanIP} onChange={e => setNewBanIP(e.target.value)} placeholder="أدخل عنوان IP..."
              className="bg-white/[0.04] border-white/10 text-white text-sm flex-1" />
            <Button onClick={() => banIP(newBanIP)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs" size="sm">حظر</Button>
          </div>
          {bannedIPs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bannedIPs.map(ip => (
                <Badge key={ip} className="bg-red-500/10 text-red-400 border-red-500/20 cursor-pointer hover:bg-red-500/20" onClick={() => unbanIP(ip)}>
                  {ip} ✕
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search & Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث في السجلات..."
            className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#39FF14]/30" />
        </div>
        <Button onClick={loadLogs} variant="ghost" size="icon" className="text-white/30 hover:text-[#39FF14]"><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Logs */}
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
        {filtered.map(log => (
          <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
            <div className={`p-1.5 rounded-lg ${getActionColor(log.action_type)}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{log.action_type}</p>
              <div className="flex items-center gap-3 text-[10px] text-white/25 mt-0.5">
                {log.ip_address && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{log.ip_address}</span>}
                {log.attempted_route && <span>📍 {log.attempted_route}</span>}
                <span>{log.user_id?.slice(0, 8) || 'مجهول'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {log.ip_address && !bannedIPs.includes(log.ip_address) && (
                <Button size="sm" variant="ghost" onClick={() => banIP(log.ip_address)} className="text-red-400/60 hover:bg-red-500/10 h-6 text-[9px] px-2">حظر</Button>
              )}
              <span className="text-[10px] text-white/15 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.created_at).toLocaleString('ar-IQ')}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-12">لا توجد سجلات</p>}
      </div>
    </div>
  );
};

export default VaultSecurityAudit;
