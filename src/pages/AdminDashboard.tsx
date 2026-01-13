import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, FileText, Activity, Shield, Video, MessageCircle, Heart, Image, 
  TrendingUp, TrendingDown, Settings, Bell, BarChart3, Globe, CheckCircle,
  Smartphone, Monitor, Tablet, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

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

  // Mock data for charts
  const networkActivityData = [
    { name: 'Jan 01', value: 30, views: 45 },
    { name: 'Jan 02', value: 45, views: 52 },
    { name: 'Jan 03', value: 60, views: 70 },
    { name: 'Jan 04', value: 35, views: 40 },
    { name: 'Jan 05', value: 75, views: 85 },
    { name: 'Jan 06', value: 55, views: 60 },
    { name: 'Jan 07', value: 80, views: 95 },
  ];

  const deviceUsageData = [
    { name: 'iOS', value: 35, color: '#22c55e' },
    { name: 'Android', value: 30, color: '#3b82f6' },
    { name: 'Windows', value: 20, color: '#8b5cf6' },
    { name: 'MacOS', value: 10, color: '#f59e0b' },
    { name: 'Others', value: 5, color: '#6b7280' },
  ];

  const campaignData = [
    { name: 'Facebook Campaign', value: 85, color: '#22c55e' },
    { name: 'Twitter Campaign', value: 70, color: '#3b82f6' },
    { name: 'Email Campaign', value: 55, color: '#f59e0b' },
    { name: 'Conventional', value: 45, color: '#8b5cf6' },
    { name: 'Bill Boards', value: 30, color: '#ec4899' },
  ];

  const appVersionsData = [
    { version: 'V 1.5.2', users: '123k' },
    { version: 'V 1.3.1', users: '53k' },
    { version: 'V 1.2.8', users: '12k' },
    { version: 'V 1.1.6', users: '3k' },
    { version: 'V 1.1.0', users: '1k' },
  ];

  const recentActivities = [
    { title: 'مستخدم جديد قام بالتسجيل', desc: 'تم تسجيل حساب جديد في النظام', time: 'منذ 5 دقائق' },
    { title: 'تم نشر منشور جديد', desc: 'قام أحد المستخدمين بنشر صورة جديدة', time: 'منذ 15 دقيقة' },
    { title: 'تم رفع ريلز جديد', desc: 'تم رفع فيديو قصير للمراجعة', time: 'منذ 30 دقيقة' },
    { title: 'طلب توثيق جديد', desc: 'مستخدم يطلب توثيق حسابه', time: 'منذ ساعة' },
  ];

  const visitorsData = [
    { country: 'العراق', percentage: 45 },
    { country: 'السعودية', percentage: 25 },
    { country: 'مصر', percentage: 15 },
    { country: 'الإمارات', percentage: 10 },
    { country: 'الأردن', percentage: 5 },
  ];

  useEffect(() => {
    checkAuthorization();
    loadStats();
  }, []);

  const checkAuthorization = async () => {
    try {
      const pinAuthenticated = sessionStorage.getItem('admin_authenticated');
      if (pinAuthenticated === 'true') {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin-login');
        return;
      }

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
        <div className="text-primary text-xl animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  const totalContent = stats.totalPosts + stats.totalReels + stats.totalStories;
  const engagementRate = stats.totalPosts > 0 ? ((stats.totalLikes / stats.totalPosts) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-black">
      <AdminHeader />
      
      <main className="pt-20 pb-8 px-4 lg:px-8">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">المستخدمين</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalProfiles.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">+5% من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">المنشورات</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">+12% من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">الريلز</span>
                <Video className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalReels.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">+8% من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">القصص</span>
                <Image className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalStories.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowDownRight className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-500">-3% من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">الإعجابات</span>
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalLikes.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary">+15% من الأسبوع الماضي</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Network Activity Chart */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  نشاط الشبكة
                </CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    المشاهدات
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    التفاعلات
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={networkActivityData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(120, 100%, 50%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area type="monotone" dataKey="views" stroke="hsl(120, 100%, 50%)" fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Campaign Performance */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                أداء الحملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-primary">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.value}%`, 
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* App Versions */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                إصدارات التطبيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appVersionsData.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{item.version}</span>
                    <span className="text-primary font-medium">{item.users}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Usage */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                استخدام الأجهزة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deviceUsageData.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">{item.name}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                الإعدادات السريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">الإشعارات</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">التسجيل التلقائي</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">الترجمة الفورية</span>
                  <Switch />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">الإشراف الآلي</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                معدل الإكمال
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#374151"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="hsl(120, 100%, 50%)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * 0.75} ${2 * Math.PI * 56}`}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_10px_hsl(120,100%,50%,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">75%</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-2">معدل إكمال الملفات الشخصية</p>
            </CardContent>
          </Card>
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Activities */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                النشاط الأخير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex gap-3 pb-3 border-b border-gray-800 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.desc}</p>
                      <p className="text-xs text-primary mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visitors Location */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                توزيع الزوار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visitorsData.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.country}</span>
                      <span className="text-primary">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                الإجراءات السريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => navigate('/admin/surveillance')}
                  className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg hover:border-primary/60 transition-colors text-left"
                >
                  <Eye className="w-5 h-5 text-primary mb-1" />
                  <p className="text-xs text-white font-medium">المراقبة</p>
                </button>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
                >
                  <Users className="w-5 h-5 text-blue-500 mb-1" />
                  <p className="text-xs text-white font-medium">المستخدمين</p>
                </button>
                <button 
                  onClick={() => navigate('/admin/content')}
                  className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-purple-500 mb-1" />
                  <p className="text-xs text-white font-medium">المحتوى</p>
                </button>
                <button 
                  onClick={() => navigate('/admin/staff')}
                  className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
                >
                  <Shield className="w-5 h-5 text-orange-500 mb-1" />
                  <p className="text-xs text-white font-medium">الموظفين</p>
                </button>
                <button 
                  onClick={() => navigate('/admin/verification')}
                  className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
                >
                  <CheckCircle className="w-5 h-5 text-cyan-500 mb-1" />
                  <p className="text-xs text-white font-medium">التوثيق</p>
                </button>
                <button 
                  onClick={() => navigate('/admin/settings')}
                  className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors text-left"
                >
                  <Settings className="w-5 h-5 text-gray-400 mb-1" />
                  <p className="text-xs text-white font-medium">الإعدادات</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalComments.toLocaleString()}</p>
              <p className="text-xs text-gray-400">التعليقات</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{engagementRate}%</p>
              <p className="text-xs text-gray-400">معدل التفاعل</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{totalContent.toLocaleString()}</p>
              <p className="text-xs text-gray-400">إجمالي المحتوى</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-gray-400">الموظفين</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
