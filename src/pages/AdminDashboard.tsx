import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, Activity, Shield, Video, MessageCircle, Heart, Image, Megaphone } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalProfiles: 0,
    totalReels: 0,
    totalComments: 0,
    totalStories: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    checkAuthorization();
    loadStats();
  }, []);

  const checkAuthorization = async () => {
    try {
      // Check if authenticated via PIN first
      const pinAuthenticated = sessionStorage.getItem('admin_authenticated');
      if (pinAuthenticated === 'true') {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // Otherwise, check database authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin-login');
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
        await supabase.auth.signOut();
        navigate('/admin-login');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersCount, postsCount, profilesCount, reelsCount, commentsCount, storiesCount, likesCount] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('reels').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalProfiles: profilesCount.count || 0,
        totalReels: reelsCount.count || 0,
        totalComments: commentsCount.count || 0,
        totalStories: storiesCount.count || 0,
        totalLikes: likesCount.count || 0,
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
              لوحة التحكم الرئيسية
            </h1>
            <p className="text-gray-400">إدارة شاملة ومراقبة كاملة للتطبيق والمستخدمين</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <Video className="w-5 h-5 text-red-500" />
                  الريلز
                </CardTitle>
                <CardDescription>إجمالي الريلز</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalReels}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Image className="w-5 h-5 text-yellow-500" />
                  القصص
                </CardTitle>
                <CardDescription>إجمالي القصص</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalStories}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="w-5 h-5 text-cyan-500" />
                  التعليقات
                </CardTitle>
                <CardDescription>إجمالي التعليقات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalComments}</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Heart className="w-5 h-5 text-pink-500" />
                  الإعجابات
                </CardTitle>
                <CardDescription>إجمالي الإعجابات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalLikes}</p>
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

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-orange-500" />
                  الموظفين
                </CardTitle>
                <CardDescription>عدد الموظفين</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-white">{stats.totalUsers}</p>
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
                  <span className="text-gray-400">إجمالي المحتوى</span>
                  <span className="text-white font-semibold">
                    {stats.totalPosts + stats.totalReels + stats.totalStories}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">متوسط المنشورات للمستخدم</span>
                  <span className="text-white font-semibold">
                    {stats.totalProfiles > 0 
                      ? (stats.totalPosts / stats.totalProfiles).toFixed(2) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">متوسط التعليقات للمنشور</span>
                  <span className="text-white font-semibold">
                    {stats.totalPosts > 0 
                      ? (stats.totalComments / stats.totalPosts).toFixed(2) 
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">معدل التفاعل</span>
                  <span className="text-white font-semibold">
                    {stats.totalPosts > 0 
                      ? ((stats.totalLikes / stats.totalPosts) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">الموظفين النشطين</span>
                  <span className="text-white font-semibold">{stats.totalUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">الإجراءات السريعة</CardTitle>
                <CardDescription>أدوات إدارة سريعة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div 
                  onClick={() => navigate('/admin/staff')}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <p className="text-white font-medium">إدارة الموظفين</p>
                  <p className="text-gray-400 text-sm">إضافة وحذف المديرين والمشرفين</p>
                </div>
                <div 
                  onClick={() => navigate('/admin/users')}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <p className="text-white font-medium">إدارة المستخدمين والأرباح</p>
                  <p className="text-gray-400 text-sm">إيداع وسحب الأرباح وتعديل المتابعين وكلمات السر</p>
                </div>
                <div 
                  onClick={() => navigate('/admin/content')}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <p className="text-white font-medium">إدارة المحتوى</p>
                  <p className="text-gray-400 text-sm">مراجعة وحذف المنشورات والريلز</p>
                </div>
                <div 
                  onClick={() => navigate('/admin/ads')}
                  className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <p className="text-white font-medium">إدارة الإعلانات</p>
                  <p className="text-gray-400 text-sm">إنشاء وإدارة الإعلانات داخل التطبيق</p>
                </div>
                <div 
                  onClick={() => navigate('/admin/settings')}
                  className="p-3 bg-gradient-to-r from-primary/20 to-purple-900/20 border border-primary/50 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  <p className="text-white font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    الإعدادات المتقدمة
                  </p>
                  <p className="text-gray-400 text-sm">التحكم الكامل بقاعدة البيانات والنظام</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
                  <p className="text-white font-medium">التقارير والإحصائيات</p>
                  <p className="text-gray-400 text-sm">تقارير مفصلة عن النشاط</p>
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
