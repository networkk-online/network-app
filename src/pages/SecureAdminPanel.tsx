import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield, Search, BadgeCheck, Building2, Landmark, Star,
  XCircle, Users, Activity, LogOut, RefreshCw, Clock,
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  verification_type: string | null;
  created_at: string;
}

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

const SecureAdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    username: string;
    type: 'business' | 'notable' | 'government' | null;
  } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        navigate('/');
        return;
      }

      setCurrentUserId(user.id);
      setAuthorized(true);
      setLoading(false);
      loadUsers();
      loadLogs();
    } catch {
      navigate('/');
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, verification_type, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setUsers(data);
  };

  const loadLogs = async () => {
    const { data } = await supabase
      .from('verification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      const adminIds = [...new Set(data.map(l => l.admin_id))];
      const targetIds = [...new Set(data.map(l => l.target_user_id))];
      const allIds = [...new Set([...adminIds, ...targetIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .in('id', allIds);

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

  const handleVerification = async (
    userId: string,
    type: 'business' | 'notable' | 'government' | null
  ) => {
    setActionLoading(userId);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_verified: type !== null,
          verification_type: type,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from('verification_logs').insert({
        admin_id: currentUserId,
        target_user_id: userId,
        action: type ? `verified_as_${type}` : 'removed_verification',
        verification_type: type,
      });

      toast({
        title: 'تم بنجاح',
        description: type ? `تم التحقق كـ ${getTypeLabel(type)}` : 'تم إزالة التحقق',
      });

      loadUsers();
      loadLogs();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشلت العملية',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'business': return 'حساب تجاري';
      case 'notable': return 'شخصية بارزة';
      case 'government': return 'جهة حكومية';
      default: return 'غير موثّق';
    }
  };

  const getTypeBadge = (type: string | null, verified: boolean | null) => {
    if (!verified || !type) return <Badge variant="outline" className="text-muted-foreground">غير موثّق</Badge>;
    const styles: Record<string, string> = {
      business: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      notable: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      government: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return <Badge className={styles[type] || ''}>{getTypeLabel(type)}</Badge>;
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') {
      if (filterType === 'verified') result = result.filter(u => u.is_verified);
      else if (filterType === 'unverified') result = result.filter(u => !u.is_verified);
      else result = result.filter(u => u.verification_type === filterType);
    }
    return result;
  }, [users, searchQuery, filterType]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-600 to-orange-500 p-2 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">لوحة الإدارة الآمنة</h1>
              <p className="text-xs text-muted-foreground">إدارة التحقق والمستخدمين</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { loadUsers(); loadLogs(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'text-blue-400' },
            { label: 'موثّقون', value: users.filter(u => u.is_verified).length, icon: BadgeCheck, color: 'text-green-400' },
            { label: 'تجاري', value: users.filter(u => u.verification_type === 'business').length, icon: Building2, color: 'text-yellow-400' },
            { label: 'حكومي', value: users.filter(u => u.verification_type === 'government').length, icon: Landmark, color: 'text-gray-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#111] border-border/20">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-[#111] border border-border/20">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> المستخدمين
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Clock className="h-4 w-4" /> سجلات التحقق
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث باسم المستخدم أو الاسم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-[#111] border-border/30 text-white"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48 bg-[#111] border-border/30 text-white">
                  <SelectValue placeholder="تصفية" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-border/30">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="verified">موثّقون فقط</SelectItem>
                  <SelectItem value="unverified">غير موثّقين</SelectItem>
                  <SelectItem value="business">تجاري</SelectItem>
                  <SelectItem value="notable">شخصية بارزة</SelectItem>
                  <SelectItem value="government">حكومي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-[#111] border-border/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-muted-foreground">
                        <th className="text-right p-4">المستخدم</th>
                        <th className="text-right p-4 hidden md:table-cell">تاريخ الانضمام</th>
                        <th className="text-right p-4">الحالة</th>
                        <th className="text-right p-4">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-border/10 hover:bg-white/5 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-white">{user.full_name || 'بدون اسم'}</p>
                                <p className="text-xs text-muted-foreground">@{user.username || 'unknown'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                            {new Date(user.created_at).toLocaleDateString('ar-IQ')}
                          </td>
                          <td className="p-4">{getTypeBadge(user.verification_type, user.is_verified)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading === user.id}
                                onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'business' })}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 gap-1 text-xs px-2"
                                title="تحقق كشركة"
                              >
                                <Building2 className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">تجاري</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading === user.id}
                                onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'notable' })}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 text-xs px-2"
                                title="تحقق كشخصية بارزة"
                              >
                                <Star className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">بارز</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading === user.id}
                                onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'government' })}
                                className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 gap-1 text-xs px-2"
                                title="تحقق كجهة حكومية"
                              >
                                <Landmark className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">حكومي</span>
                              </Button>
                              {user.is_verified && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={actionLoading === user.id}
                                  onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: null })}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 text-xs px-2"
                                  title="إزالة التحقق"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span className="hidden lg:inline">إزالة</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            لا توجد نتائج
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-[#111] border-border/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  سجلات التحقق
                </CardTitle>
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
                            <span className="font-medium text-primary">
                              @{log.admin_profile?.username || 'admin'}
                            </span>
                            {' '}
                            {log.action.includes('removed') ? 'أزال التحقق عن' : 'وثّق حساب'}
                            {' '}
                            <span className="font-medium text-blue-400">
                              @{log.target_profile?.username || 'user'}
                            </span>
                            {log.verification_type && (
                              <span className="text-muted-foreground"> كـ {getTypeLabel(log.verification_type)}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString('ar-IQ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-border/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmAction?.type ? 'تأكيد التحقق' : 'تأكيد إزالة التحقق'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmAction?.type
                ? `هل تريد توثيق حساب @${confirmAction?.username} كـ ${getTypeLabel(confirmAction?.type)}؟`
                : `هل تريد إزالة التحقق عن حساب @${confirmAction?.username}؟`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-border/30 text-white hover:bg-white/10">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  handleVerification(confirmAction.userId, confirmAction.type);
                  setConfirmAction(null);
                }
              }}
              className={confirmAction?.type === 'business' ? 'bg-yellow-600 hover:bg-yellow-700' :
                confirmAction?.type === 'notable' ? 'bg-blue-600 hover:bg-blue-700' :
                confirmAction?.type === 'government' ? 'bg-gray-600 hover:bg-gray-700' :
                'bg-red-600 hover:bg-red-700'}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecureAdminPanel;
