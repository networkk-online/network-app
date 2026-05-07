import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  User, 
  MapPin, 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  LogIn, 
  LogOut, 
  ExternalLink,
  Shield,
  Fingerprint,
  Activity,
  Eye,
  Calendar,
  RefreshCw,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  created_at: string;
  followers_count: number | null;
  following_count: number | null;
  is_verified: boolean | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
}

interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
}

const AdminSurveillance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userLogs, setUserLogs] = useState<LogEntry[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

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
    setLoading(false);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,id.eq.${searchQuery}`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Search error:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  const selectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
    setLocationData(null);
    await fetchUserLogs(user.id);
  };

  const fetchUserLogs = async (userId: string) => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-user-logs-by-id', {
        body: { userId }
      });

      if (error) throw error;
      setUserLogs(data?.logs || []);

      // Get location for latest IP
      if (data?.logs?.length > 0 && data.logs[0].ipAddress) {
        fetchLocation(data.logs[0].ipAddress);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب سجلات المستخدم',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchLocation = async (ip: string) => {
    setLoadingLocation(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-ip-location', {
        body: { ip }
      });

      if (error) throw error;
      if (data && !data.error) {
        setLocationData(data);
      }
    } catch (error: any) {
      console.error('Error fetching location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const getDeviceInfo = (userAgent: string) => {
    if (!userAgent) return { device: 'غير معروف', browser: 'غير معروف', os: 'غير معروف' };
    
    let device = 'حاسوب';
    let browser = 'متصفح آخر';
    let os = 'نظام آخر';

    if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'هاتف محمول';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'جهاز لوحي';

    if (userAgent.includes('Chrome')) browser = 'Google Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Microsoft Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Linux')) os = 'Linux';

    return { device, browser, os };
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd MMM yyyy - HH:mm:ss', { locale: ar });
    } catch {
      return timestamp;
    }
  };

  const openGoogleMaps = () => {
    if (locationData) {
      window.open(`https://www.google.com/maps?q=${locationData.lat},${locationData.lon}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#00ff00] text-xl animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  if (!authorized) return null;

  const latestLog = userLogs[0];
  const deviceInfo = latestLog ? getDeviceInfo(latestLog.userAgent) : null;

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminHeader />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#00ff00]" />
            <h1 className="text-3xl font-bold text-[#00ff00]">نظام المراقبة المتقدم</h1>
          </div>
          <p className="text-gray-500">مراقبة وتتبع المستخدمين - مستوى الوصول: إداري</p>
        </div>

        {/* Search Bar */}
        <Card className="bg-gray-950 border-gray-800 mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00ff00] w-5 h-5" />
              <Input
                placeholder="البحث بالاسم، اسم المستخدم، أو المعرف الرقمي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 bg-black border-gray-700 text-white placeholder:text-gray-500 focus:border-[#00ff00] focus:ring-[#00ff00] h-14 text-lg"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border border-gray-800 rounded-lg overflow-hidden">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="flex items-center gap-4 p-4 hover:bg-gray-900 cursor-pointer border-b border-gray-800 last:border-b-0 transition-colors"
                  >
                    <Avatar className="h-12 w-12 border-2 border-[#00ff00]/30">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback className="bg-gray-800 text-[#00ff00]">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-medium">{user.full_name || 'بدون اسم'}</p>
                      <p className="text-gray-400 text-sm">@{user.username || 'unknown'}</p>
                    </div>
                    <div className="text-gray-500 text-xs font-mono">
                      {user.id.substring(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Dossier */}
        {selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <Card className="bg-gray-950 border-gray-800 border-l-4 border-l-[#00ff00]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#00ff00] flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    ملف المستخدم السري
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-[#00ff00]/50">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback className="bg-gray-800 text-[#00ff00] text-2xl">
                      {selectedUser.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{selectedUser.full_name || 'بدون اسم'}</h2>
                      {selectedUser.is_verified && (
                        <Badge className="bg-[#00ff00]/20 text-[#00ff00] border-[#00ff00]/50">موثق</Badge>
                      )}
                    </div>
                    <p className="text-[#00ff00] text-lg">@{selectedUser.username || 'unknown'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                        <p className="text-gray-500 text-xs">المعرف</p>
                        <p className="text-white font-mono text-sm">{selectedUser.id.substring(0, 12)}...</p>
                      </div>
                      <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                        <p className="text-gray-500 text-xs">تاريخ الميلاد</p>
                        <p className="text-white text-sm">{selectedUser.birth_date || 'غير محدد'}</p>
                      </div>
                      <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                        <p className="text-gray-500 text-xs">المتابعون</p>
                        <p className="text-[#00ff00] font-bold">{selectedUser.followers_count || 0}</p>
                      </div>
                      <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                        <p className="text-gray-500 text-xs">يتابع</p>
                        <p className="text-[#00ff00] font-bold">{selectedUser.following_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Fingerprint & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Fingerprint */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-[#00ff00] flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    بصمة الجهاز
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#00ff00]" />
                    </div>
                  ) : deviceInfo ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg border border-gray-800">
                        {deviceInfo.device === 'هاتف محمول' ? (
                          <Smartphone className="w-8 h-8 text-[#00ff00]" />
                        ) : (
                          <Monitor className="w-8 h-8 text-[#00ff00]" />
                        )}
                        <div>
                          <p className="text-gray-500 text-xs">نوع الجهاز</p>
                          <p className="text-white font-medium">{deviceInfo.device}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg border border-gray-800">
                        <Globe className="w-8 h-8 text-[#00ff00]" />
                        <div>
                          <p className="text-gray-500 text-xs">المتصفح</p>
                          <p className="text-white font-medium">{deviceInfo.browser}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg border border-gray-800">
                        <Activity className="w-8 h-8 text-[#00ff00]" />
                        <div>
                          <p className="text-gray-500 text-xs">نظام التشغيل</p>
                          <p className="text-white font-medium">{deviceInfo.os}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">لا توجد بيانات متاحة</p>
                  )}
                </CardContent>
              </Card>

              {/* Geographic Tracking */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-[#00ff00] flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    التتبع الجغرافي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLocation ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#00ff00]" />
                    </div>
                  ) : locationData ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-black/50 rounded-lg border border-gray-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 text-xs">الدولة</p>
                            <p className="text-white font-medium">{locationData.country}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">المدينة</p>
                            <p className="text-white font-medium">{locationData.city}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">المنطقة</p>
                            <p className="text-white font-medium">{locationData.regionName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">مزود الخدمة</p>
                            <p className="text-white font-medium text-sm">{locationData.isp}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-black/50 rounded-lg border border-gray-800">
                        <p className="text-gray-500 text-xs mb-1">آخر عنوان IP</p>
                        <p className="text-[#00ff00] font-mono">{latestLog?.ipAddress}</p>
                      </div>
                      <Button
                        onClick={openGoogleMaps}
                        className="w-full bg-[#00ff00]/20 hover:bg-[#00ff00]/30 text-[#00ff00] border border-[#00ff00]/50"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        فتح في خرائط جوجل
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">لا توجد بيانات موقع متاحة</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Logs */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-[#00ff00] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  سجل العمليات
                  <Badge className="bg-gray-800 text-[#00ff00] ml-2">{userLogs.length} سجل</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#00ff00]" />
                  </div>
                ) : userLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    لا توجد سجلات لهذا المستخدم
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-transparent">
                          <TableHead className="text-right text-[#00ff00]">الإجراء</TableHead>
                          <TableHead className="text-right text-[#00ff00]">عنوان IP</TableHead>
                          <TableHead className="text-right text-[#00ff00]">الجهاز</TableHead>
                          <TableHead className="text-right text-[#00ff00]">المتصفح</TableHead>
                          <TableHead className="text-right text-[#00ff00]">التوقيت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userLogs.map((log, index) => {
                          const info = getDeviceInfo(log.userAgent);
                          return (
                            <TableRow key={index} className="border-gray-800 hover:bg-gray-900/50">
                              <TableCell>
                                <Badge 
                                  className={`gap-1 ${
                                    log.action === 'login' 
                                      ? 'bg-[#00ff00]/20 text-[#00ff00] border-[#00ff00]/50' 
                                      : 'bg-red-500/20 text-red-400 border-red-500/50'
                                  }`}
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
                              <TableCell className="font-mono text-[#00ff00]">
                                {log.ipAddress || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <div className="flex items-center gap-2">
                                  {info.device === 'هاتف محمول' ? (
                                    <Smartphone className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <Monitor className="w-4 h-4 text-gray-500" />
                                  )}
                                  {info.device}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-300">{info.browser}</TableCell>
                              <TableCell className="text-gray-400 text-sm">
                                {formatTimestamp(log.timestamp)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedUser && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 rounded-full bg-gray-900 border-4 border-[#00ff00]/30 flex items-center justify-center mb-6">
              <Eye className="w-16 h-16 text-[#00ff00]/50" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2">نظام المراقبة جاهز</h3>
            <p className="text-gray-600">ابحث عن مستخدم للبدء في عرض ملفه السري</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSurveillance;
