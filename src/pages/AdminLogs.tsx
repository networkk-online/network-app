import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, LogIn, LogOut, Monitor, Smartphone, Globe, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
}

const AdminLogs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin-login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdminRole = roles?.some(r => r.role === 'admin' || r.role === 'moderator');
    if (!hasAdminRole) {
      navigate('/admin-login');
      return;
    }

    setAuthorized(true);
    fetchLogs();
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-user-logs');

      if (error) throw error;

      setLogs(data.logs || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب السجلات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent?.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent: string) => {
    if (!userAgent) return 'غير معروف';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'متصفح آخر';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd MMM yyyy - HH:mm:ss', { locale: ar });
    } catch {
      return timestamp;
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <AdminHeader />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">سجلات الدخول والخروج</h1>
            <p className="text-gray-400">مراقبة نشاط المستخدمين في الوقت الفعلي</p>
          </div>
          <Button 
            onClick={fetchLogs} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">إجمالي السجلات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{logs.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">عمليات الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">
                {logs.filter(l => l.action === 'login').length}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">عمليات الخروج</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">
                {logs.filter(l => l.action === 'logout').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              السجلات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                لا توجد سجلات حتى الآن
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-right text-gray-400">الإجراء</TableHead>
                      <TableHead className="text-right text-gray-400">معرف المستخدم</TableHead>
                      <TableHead className="text-right text-gray-400">عنوان IP</TableHead>
                      <TableHead className="text-right text-gray-400">المتصفح</TableHead>
                      <TableHead className="text-right text-gray-400">الجهاز</TableHead>
                      <TableHead className="text-right text-gray-400">التوقيت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={index} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell>
                          <Badge 
                            variant={log.action === 'login' ? 'default' : 'destructive'}
                            className={`gap-1 ${log.action === 'login' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                          >
                            {log.action === 'login' ? (
                              <>
                                <LogIn className="h-3 w-3" />
                                دخول
                              </>
                            ) : (
                              <>
                                <LogOut className="h-3 w-3" />
                                خروج
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-300">
                          {log.userId?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Globe className="h-4 w-4 text-gray-500" />
                            {log.ipAddress || 'غير متوفر'}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {getBrowserName(log.userAgent)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-400">
                            {getDeviceIcon(log.userAgent)}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {formatTimestamp(log.timestamp)}
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

export default AdminLogs;
