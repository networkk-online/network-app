import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Activity, Wifi, WifiOff, LogOut, FileText, RefreshCw } from 'lucide-react';

const StealthDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [reports, setReports] = useState<any[]>([]);
  const [serverOnline, setServerOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: check auth + session flag
    const checkAccess = async () => {
      const verified = sessionStorage.getItem('stealth_verified');
      if (!verified) {
        navigate('/system-access');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/system-access');
        return;
      }

      // Verify admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(
        (r) => r.role === 'admin' || r.role === 'moderator'
      );

      if (!isAdmin) {
        navigate('/');
        return;
      }

      await loadData();
    };

    checkAccess();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Total users
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Today's signups
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({ total: totalCount || 0, today: todayCount || 0 });

      // Recent reports as "support tickets"
      const { data: reportsData } = await supabase
        .from('reports')
        .select('id, report_type, report_reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      setReports(reportsData || []);

      // Check server connectivity
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('stealth_verified');
    supabase.auth.signOut();
    navigate('/system-access');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Subtle grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,65,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00ff41]" />
            <span className="font-mono text-sm text-[#00ff41] tracking-wider uppercase">
              System Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="text-gray-500 hover:text-[#00ff41] font-mono text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 font-mono text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#111] border-[#1a1a1a]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-wider">
                <Users className="h-4 w-4 text-[#00ff41]" />
                Active Subscribers
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
                <UserPlus className="h-4 w-4 text-[#00ff41]" />
                New Today
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
                {serverOnline ? (
                  <Wifi className="h-4 w-4 text-[#00ff41]" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
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
              <FileText className="h-4 w-4 text-[#00ff41]" />
              Recent Support Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-center text-sm font-mono text-gray-600 py-8">
                No tickets found
              </p>
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
                        <TableCell className="font-mono text-xs text-gray-400">
                          {r.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-300">
                          {r.report_type}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-300 max-w-[200px] truncate">
                          {r.report_reason}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-mono text-[10px] ${statusColor(r.status)}`}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StealthDashboard;
