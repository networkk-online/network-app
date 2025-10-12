import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, Activity, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalProfiles: 0,
  });

  useEffect(() => {
    checkAuthorization();
    loadStats();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Check if user has admin or moderator role
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator']);

      if (error || !roles || roles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات للوصول إلى لوحة التحكم",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersCount, postsCount, profilesCount] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalProfiles: profilesCount.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-green-500" />
              لوحة تحكم الموظفين
            </h1>
            <p className="text-gray-400">إدارة ومراقبة التطبيق</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-blue-500" />
                  المستخدمين
                </CardTitle>
                <CardDescription>عدد المستخدمين المسجلين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalProfiles}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-green-500" />
                  المنشورات
                </CardTitle>
                <CardDescription>إجمالي المنشورات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalPosts}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-purple-500" />
                  النشاط
                </CardTitle>
                <CardDescription>نسبة النشاط</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">
                  {stats.totalProfiles > 0 
                    ? ((stats.totalPosts / stats.totalProfiles) * 100).toFixed(1) 
                    : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">نظرة عامة</CardTitle>
                <CardDescription>معلومات سريعة عن التطبيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">متوسط المنشورات للمستخدم</span>
                  <span className="text-white font-semibold">
                    {stats.totalProfiles > 0 
                      ? (stats.totalPosts / stats.totalProfiles).toFixed(2) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">إجمالي الحسابات</span>
                  <span className="text-white font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">الملفات الشخصية المكتملة</span>
                  <span className="text-white font-semibold">{stats.totalProfiles}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">الإجراءات السريعة</CardTitle>
                <CardDescription>أدوات إدارة سريعة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  <p className="text-white font-medium">عرض جميع المستخدمين</p>
                  <p className="text-gray-400 text-sm">إدارة حسابات المستخدمين</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  <p className="text-white font-medium">مراجعة المنشورات</p>
                  <p className="text-gray-400 text-sm">إدارة المحتوى المنشور</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  <p className="text-white font-medium">إعدادات التطبيق</p>
                  <p className="text-gray-400 text-sm">تكوين إعدادات النظام</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
