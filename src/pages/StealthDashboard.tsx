import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Wifi, WifiOff, FileText } from 'lucide-react';

const StealthDashboard = () => {
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [reports, setReports] = useState<any[]>([]);
  const [serverOnline, setServerOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({ total: totalCount || 0, today: todayCount || 0 });

      const { data: reportsData } = await supabase
        .from('reports')
        .select('id, report_type, report_reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      setReports(reportsData || []);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <StealthLayout onRefresh={loadData}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">System Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <Users className="h-4 w-4 text-[#00ff41]" /> Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono text-[#00ff41] font-bold">
              {loading ? '—' : stats.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              <UserPlus className="h-4 w-4 text-[#00ff41]" /> New Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono text-[#00ff41] font-bold">
              {loading ? '—' : stats.today}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
              {serverOnline ? <Wifi className="h-4 w-4 text-[#00ff41]" /> : <WifiOff className="h-4 w-4 text-red-400" />}
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${serverOnline ? 'bg-[#00ff41] animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-lg font-mono font-bold ${serverOnline ? 'text-[#00ff41]' : 'text-red-400'}`}>
                {serverOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card className="bg-[#111] border-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
            <FileText className="h-4 w-4 text-[#00ff41]" /> Recent Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-sm font-mono text-gray-600 py-8">No tickets found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                    <TableHead className="font-mono text-xs text-gray-500">ID</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Type</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Reason</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Status</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                      <TableCell className="font-mono text-xs text-gray-400">{r.id.slice(0, 8)}…</TableCell>
                      <TableCell className="font-mono text-xs text-gray-300">{r.report_type}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-300 max-w-[200px] truncate">{r.report_reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </StealthLayout>
  );
};

export default StealthDashboard;
