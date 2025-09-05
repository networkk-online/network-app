import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Shield, 
  Settings, 
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Lock,
  LogIn,
  Globe,
  FolderOpen,
  Mail,
  MessageCircle,
  Images,
  ClipboardList,
  CalendarDays,
  Languages,
  Download,
  Upload,
  Trash,
  PieChart,
  LineChart,
  BarChart,
  Calendar as CalendarIcon,
  Clock,
  Send,
  Archive,
  Star,
  Plus,
  Maximize2,
  Minimize2,
  Menu,
  X,
  Crown,
  ShieldCheck,
  UserCog,
  Key,
  Database,
  Server,
  Monitor,
  Zap
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userIP, setUserIP] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('ar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Admin credentials - في التطبيق الحقيقي ستكون في قاعدة البيانات
  const adminCredentials = {
    username: 'admin',
    password: 'admin123'
  };

  // الحصول على عنوان IP للمستخدم
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
      } catch (error) {
        setUserIP('غير معروف');
      }
    };
    fetchIP();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === adminCredentials.username && 
        loginForm.password === adminCredentials.password) {
      setIsAuthenticated(true);
      setLoginError('');
      
      // إشعار تسجيل دخول مطور
      const currentTime = new Date().toLocaleString('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'medium'
      });
      
      toast({
        title: "🚨 تنبيه أمني - دخول مطور",
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>IP: {userIP}</span>
            </div>
            <div>وقت الدخول: {currentTime}</div>
            <div>اسم المستخدم: {loginForm.username}</div>
          </div>
        ),
        duration: 10000,
      });
    } else {
      setLoginError('بيانات تسجيل الدخول غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
  };

  // إذا لم يتم تسجيل الدخول، إظهار صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-900/20 rounded-full">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">منطقة محظورة</CardTitle>
            <CardDescription>
              يجب تسجيل الدخول للوصول إلى لوحة التحكم الإدارية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert className="bg-red-900/20 border-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  اسم المستخدم
                </label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="bg-gray-800 border-gray-600"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  كلمة المرور
                </label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="bg-gray-800 border-gray-600"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                <LogIn className="w-4 h-4 mr-2" />
                تسجيل الدخول
              </Button>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                للمطورين: admin / admin123
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data - في التطبيق الحقيقي ستأتي من قاعدة البيانات
  const stats = {
    totalUsers: 15420,
    totalPosts: 89340,
    totalMessages: 245678,
    activeUsers: 8934,
    reportsToday: 23,
    revenue: 45678
  };

  const users = [
    {
      id: 1,
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      password: 'password123',
      followers: 1250,
      following: 890,
      posts: 45,
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-07-28',
      verified: true
    },
    {
      id: 2,
      name: 'فاطمة علي',
      email: 'fatima@example.com',
      password: 'mypassword456',
      followers: 2340,
      following: 1200,
      posts: 78,
      status: 'active',
      joinDate: '2024-02-10',
      lastLogin: '2024-07-27',
      verified: false
    },
    {
      id: 3,
      name: 'محمد حسن',
      email: 'mohamed@example.com',
      password: 'securepass789',
      followers: 890,
      following: 567,
      posts: 23,
      status: 'suspended',
      joinDate: '2024-03-05',
      lastLogin: '2024-07-20',
      verified: true
    }
  ];

  const posts = [
    {
      id: 1,
      author: 'أحمد محمد',
      content: 'منشور رائع عن التقنية',
      likes: 234,
      comments: 45,
      shares: 12,
      reports: 0,
      status: 'published',
      date: '2024-07-28'
    },
    {
      id: 2,
      author: 'فاطمة علي',
      content: 'تجربة مشاركة جديدة',
      likes: 567,
      comments: 89,
      shares: 23,
      reports: 2,
      status: 'under_review',
      date: '2024-07-27'
    }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFollowers = (userId: number, action: 'increase' | 'decrease') => {
    // في التطبيق الحقيقي سيتم تحديث قاعدة البيانات
    console.log(`${action} followers for user ${userId}`);
  };

  // Mock data for charts and modules
  const chartData = [
    { name: 'يناير', users: 4000, posts: 2400, revenue: 2400 },
    { name: 'فبراير', users: 3000, posts: 1398, revenue: 2210 },
    { name: 'مارس', users: 2000, posts: 9800, revenue: 2290 },
    { name: 'أبريل', users: 2780, posts: 3908, revenue: 2000 },
    { name: 'مايو', users: 1890, posts: 4800, revenue: 2181 },
    { name: 'يونيو', users: 2390, posts: 3800, revenue: 2500 },
  ];

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const files = [
    { id: 1, name: 'تقرير_المبيعات.pdf', size: '2.4 MB', type: 'pdf', uploadDate: '2024-07-28' },
    { id: 2, name: 'صورة_المنتج.jpg', size: '1.2 MB', type: 'image', uploadDate: '2024-07-27' },
    { id: 3, name: 'بيانات_المستخدمين.xlsx', size: '850 KB', type: 'excel', uploadDate: '2024-07-26' },
  ];

  const emails = [
    { id: 1, from: 'user@example.com', subject: 'استفسار عن الخدمة', date: '2024-07-28', read: false },
    { id: 2, from: 'admin@company.com', subject: 'تقرير أسبوعي', date: '2024-07-27', read: true },
    { id: 3, from: 'support@platform.com', subject: 'تحديث النظام', date: '2024-07-26', read: true },
  ];

  const messages = [
    { id: 1, user: 'أحمد محمد', message: 'مرحبا، كيف يمكنني المساعدة؟', time: '10:30', read: false },
    { id: 2, user: 'فاطمة علي', message: 'هل يمكن تحديث ملفي الشخصي؟', time: '10:15', read: true },
    { id: 3, user: 'محمد حسن', message: 'شكرا لكم على الخدمة الممتازة', time: '09:45', read: true },
  ];

  const galleryImages = [
    { id: 1, name: 'صورة_1.jpg', url: '/lovable-uploads/3228b102-769a-43ee-92c5-9f0c0b2b928e.png', size: '1.5 MB' },
    { id: 2, name: 'صورة_2.jpg', url: '/lovable-uploads/af5dfbd6-d4e4-4f84-be84-7086fe302cd2.png', size: '2.1 MB' },
  ];

  const tasks = [
    { id: 1, title: 'مراجعة تقارير المبيعات', status: 'pending', priority: 'high', dueDate: '2024-07-30' },
    { id: 2, title: 'تحديث قاعدة البيانات', status: 'in-progress', priority: 'medium', dueDate: '2024-07-29' },
    { id: 3, title: 'إرسال تقرير شهري', status: 'completed', priority: 'low', dueDate: '2024-07-28' },
  ];

  const events = [
    { id: 1, title: 'اجتماع الفريق', date: '2024-07-30', time: '10:00' },
    { id: 2, title: 'عرض تقديمي', date: '2024-07-31', time: '14:00' },
    { id: 3, title: 'ورشة عمل', date: '2024-08-01', time: '16:00' },
  ];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0' : 'min-h-screen'} bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-auto`}>
      <div className={`${isFullscreen ? 'h-full' : ''} p-2`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-300 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم الشاملة</h1>
              <p className="text-gray-400 text-sm">إدارة متكاملة للمنصة والمحتوى</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-600">
              <Shield className="w-4 h-4 mr-2" />
              مدير النظام
            </Badge>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              تسجيل خروج
            </Button>
          </div>
        </div>

        {/* Alert for access */}
        <Alert className="mb-6 bg-red-900/20 border-red-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-300">
            تحذير: هذه صفحة إدارية سرية. الوصول غير المصرح به ممنوع.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">إجمالي المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{stats.totalUsers.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">إجمالي المنشورات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-2xl font-bold text-green-400">{stats.totalPosts.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">الرسائل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">{stats.totalMessages.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">المستخدمون النشطون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">{stats.activeUsers.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">التقارير اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{stats.reportsToday}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">${stats.revenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-700 grid grid-cols-4 lg:grid-cols-11 w-full">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700 text-xs">
              <BarChart3 className="w-4 h-4 mr-1" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700 text-xs">
              <Users className="w-4 h-4 mr-1" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-gray-700 text-xs">
              <ShieldCheck className="w-4 h-4 mr-1" />
              الصلاحيات
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-700 text-xs">
              <FileText className="w-4 h-4 mr-1" />
              المحتوى
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-gray-700 text-xs">
              <FolderOpen className="w-4 h-4 mr-1" />
              الملفات
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-gray-700 text-xs">
              <Mail className="w-4 h-4 mr-1" />
              البريد
            </TabsTrigger>
            <TabsTrigger value="messenger" className="data-[state=active]:bg-gray-700 text-xs">
              <MessageCircle className="w-4 h-4 mr-1" />
              المسنجر
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-gray-700 text-xs">
              <Images className="w-4 h-4 mr-1" />
              المعرض
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-700 text-xs">
              <ClipboardList className="w-4 h-4 mr-1" />
              المهام
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-gray-700 text-xs">
              <CalendarDays className="w-4 h-4 mr-1" />
              التقويم
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700 text-xs">
              <Settings className="w-4 h-4 mr-1" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Charts */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-blue-400" />
                    إحصائيات المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>مستخدمون نشطون</span>
                      <span className="text-green-400">8,934</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span>مستخدمون جدد</span>
                      <span className="text-blue-400">1,234</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="w-5 h-5 mr-2 text-green-400" />
                    نمو الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-green-400">$45,678</div>
                    <div className="text-sm text-gray-400">+12.5% من الشهر الماضي</div>
                    <div className="h-32 bg-gray-800 rounded-lg flex items-end justify-around p-4">
                      {chartData.map((data, index) => (
                        <div
                          key={index}
                          className="bg-green-400 rounded-t"
                          style={{ 
                            height: `${(data.revenue / 3000) * 100}%`,
                            width: '20px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">إدارة المستخدمين</CardTitle>
                    <CardDescription>عرض وإدارة جميع مستخدمي المنصة</CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showPasswords} 
                        onCheckedChange={setShowPasswords}
                        id="show-passwords"
                      />
                      <label htmlFor="show-passwords" className="text-sm text-gray-300 cursor-pointer">
                        {showPasswords ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="البحث بالاسم أو البريد الإلكتروني..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead>المستخدم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>كلمة المرور</TableHead>
                        <TableHead>المتابعون</TableHead>
                        <TableHead>المتابَعون</TableHead>
                        <TableHead>المنشورات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>آخر تسجيل دخول</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-gray-700">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="font-medium">{user.name}</div>
                                {user.verified && (
                                  <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-600 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    موثق
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm">
                                {showPasswords ? user.password : '••••••••'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswords(!showPasswords)}
                              >
                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 font-medium">{user.followers.toLocaleString()}</span>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFollowers(user.id, 'increase')}
                                  className="h-6 w-6 p-0"
                                >
                                  <UserCheck className="w-3 h-3 text-green-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFollowers(user.id, 'decrease')}
                                  className="h-6 w-6 p-0"
                                >
                                  <UserX className="w-3 h-3 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400">{user.following.toLocaleString()}</TableCell>
                          <TableCell className="text-gray-400">{user.posts}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${
                                user.status === 'active' 
                                  ? 'bg-green-900/20 text-green-400 border-green-600' 
                                  : 'bg-red-900/20 text-red-400 border-red-600'
                              }`}
                            >
                              {user.status === 'active' ? 'نشط' : 'معلق'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Management Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <div className="grid gap-6">
              {/* Super Admin Dashboard */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                    لوحة المدير العام
                  </CardTitle>
                  <CardDescription>تحكم كامل في صلاحيات النظام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-yellow-900/20 border-yellow-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-300">المدراء العامون</p>
                            <p className="text-2xl font-bold text-yellow-400">3</p>
                          </div>
                          <Crown className="w-8 h-8 text-yellow-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-blue-900/20 border-blue-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-300">المشرفون</p>
                            <p className="text-2xl font-bold text-blue-400">12</p>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-900/20 border-green-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-300">المحررون</p>
                            <p className="text-2xl font-bold text-green-400">45</p>
                          </div>
                          <Edit className="w-8 h-8 text-green-400" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-purple-900/20 border-purple-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-300">المراقبون</p>
                            <p className="text-2xl font-bold text-purple-400">28</p>
                          </div>
                          <Eye className="w-8 h-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Admins & Moderators Management */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCog className="w-5 h-5 mr-2 text-blue-400" />
                      إدارة المشرفين
                    </CardTitle>
                    <CardDescription>تعيين وإدارة صلاحيات المشرفين</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {[
                          { name: 'محمد أحمد', role: 'مشرف عام', permissions: 'كامل', status: 'نشط' },
                          { name: 'فاطمة علي', role: 'مشرف محتوى', permissions: 'محدود', status: 'نشط' },
                          { name: 'أحمد محمود', role: 'مراقب', permissions: 'عرض فقط', status: 'معطل' }
                        ].map((admin, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">{admin.name.charAt(0)}</span>
                              </div>
                              <div>
                                <div className="font-medium">{admin.name}</div>
                                <div className="text-sm text-gray-400">{admin.role}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-600">
                                {admin.permissions}
                              </Badge>
                              <Switch defaultChecked={admin.status === 'نشط'} />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة مشرف جديد
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Role Management */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Key className="w-5 h-5 mr-2 text-green-400" />
                      إدارة الأدوار
                    </CardTitle>
                    <CardDescription>تخصيص الأدوار والصلاحيات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { role: 'مدير عام', permissions: ['كل الصلاحيات'], color: 'yellow' },
                        { role: 'مشرف محتوى', permissions: ['إدارة المنشورات', 'حذف التعليقات'], color: 'blue' },
                        { role: 'مراقب', permissions: ['عرض التقارير', 'تعديل المحتوى'], color: 'green' },
                        { role: 'محرر', permissions: ['تحرير المحتوى'], color: 'purple' }
                      ].map((role, index) => (
                        <div key={index} className="p-4 bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-medium text-${role.color}-400`}>{role.role}</h4>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            {role.permissions.map((permission, pIndex) => (
                              <div key={pIndex} className="flex items-center space-x-2">
                                <CheckCircle className={`w-3 h-3 text-${role.color}-400`} />
                                <span className="text-sm text-gray-300">{permission}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <Button variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        إنشاء دور جديد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Permissions */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-red-400" />
                    صلاحيات النظام
                  </CardTitle>
                  <CardDescription>تحكم في صلاحيات النظام الأساسية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-400">صلاحيات المحتوى</h4>
                      <div className="space-y-3">
                        {[
                          'إنشاء المنشورات',
                          'تعديل المنشورات',
                          'حذف المنشورات',
                          'إدارة التعليقات'
                        ].map((permission, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{permission}</span>
                            <Switch defaultChecked />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-400">صلاحيات المستخدمين</h4>
                      <div className="space-y-3">
                        {[
                          'عرض بيانات المستخدمين',
                          'تعديل الملفات الشخصية',
                          'حظر المستخدمين',
                          'حذف الحسابات'
                        ].map((permission, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{permission}</span>
                            <Switch defaultChecked={index < 2} />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-yellow-400">صلاحيات النظام</h4>
                      <div className="space-y-3">
                        {[
                          'إدارة الإعدادات',
                          'عرض التقارير',
                          'إدارة قاعدة البيانات',
                          'النسخ الاحتياطي'
                        ].map((permission, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{permission}</span>
                            <Switch defaultChecked={index === 1} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-400" />
                    إجراءات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="bg-blue-900/20 border-blue-600 text-blue-400 hover:bg-blue-900/30">
                      <UserCog className="w-4 h-4 mr-2" />
                      ترقية مستخدم
                    </Button>
                    <Button variant="outline" className="bg-red-900/20 border-red-600 text-red-400 hover:bg-red-900/30">
                      <UserX className="w-4 h-4 mr-2" />
                      حظر مؤقت
                    </Button>
                    <Button variant="outline" className="bg-green-900/20 border-green-600 text-green-400 hover:bg-green-900/30">
                      <Shield className="w-4 h-4 mr-2" />
                      تفعيل الحماية
                    </Button>
                    <Button variant="outline" className="bg-yellow-900/20 border-yellow-600 text-yellow-400 hover:bg-yellow-900/30">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      وضع الطوارئ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">إدارة المحتوى</CardTitle>
                <CardDescription>مراجعة وإدارة المنشورات والمحتوى</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead>الكاتب</TableHead>
                        <TableHead>المحتوى</TableHead>
                        <TableHead>الإعجابات</TableHead>
                        <TableHead>التعليقات</TableHead>
                        <TableHead>المشاركات</TableHead>
                        <TableHead>التقارير</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id} className="border-gray-700">
                          <TableCell className="font-medium">{post.author}</TableCell>
                          <TableCell className="max-w-xs truncate">{post.content}</TableCell>
                          <TableCell className="text-green-400">{post.likes}</TableCell>
                          <TableCell className="text-blue-400">{post.comments}</TableCell>
                          <TableCell className="text-purple-400">{post.shares}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={post.reports > 0 ? 'bg-red-900/20 text-red-400 border-red-600' : 'bg-gray-900/20 text-gray-400 border-gray-600'}
                            >
                              {post.reports}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${
                                post.status === 'published' 
                                  ? 'bg-green-900/20 text-green-400 border-green-600' 
                                  : 'bg-yellow-900/20 text-yellow-400 border-yellow-600'
                              }`}
                            >
                              {post.status === 'published' ? 'منشور' : 'قيد المراجعة'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">{post.date}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Manager Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2 text-yellow-400" />
                    مدير الملفات
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      رفع ملف
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      مجلد جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-400">{file.size} • {file.uploadDate}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Manager Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-400" />
                    مدير البريد الإلكتروني
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    إرسال بريد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div key={email.id} className={`flex items-center justify-between p-3 rounded-lg ${email.read ? 'bg-gray-800' : 'bg-blue-900/20'}`}>
                      <div className="flex items-center space-x-3">
                        <Mail className={`w-5 h-5 ${email.read ? 'text-gray-400' : 'text-blue-400'}`} />
                        <div>
                          <div className="font-medium">{email.subject}</div>
                          <div className="text-sm text-gray-400">من: {email.from} • {email.date}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messenger Tab */}
          <TabsContent value="messenger" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-green-400" />
                  مسنجر إداري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex items-center justify-between p-3 rounded-lg ${message.read ? 'bg-gray-800' : 'bg-green-900/20'}`}>
                      <div className="flex items-center space-x-3">
                        <MessageCircle className={`w-5 h-5 ${message.read ? 'text-gray-400' : 'text-green-400'}`} />
                        <div>
                          <div className="font-medium">{message.user}</div>
                          <div className="text-sm text-gray-400">{message.message}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">{message.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Images className="w-5 h-5 mr-2 text-purple-400" />
                    معرض الصور
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    رفع صورة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img 
                        src={image.url} 
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Manager Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-orange-400" />
                    مدير المهام
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    مهمة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'completed' ? 'bg-green-400' :
                          task.status === 'in-progress' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-400">
                            استحقاق: {task.dueDate} • الأولوية: {task.priority}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          task.priority === 'high' ? 'border-red-500 text-red-400' :
                          task.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                          'border-green-500 text-green-400'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2 text-indigo-400" />
                    التقويم الشهري
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border border-gray-700 bg-gray-800 pointer-events-auto"
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-indigo-400" />
                    الأحداث القادمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="w-5 h-5 text-indigo-400" />
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-400">{event.date} في {event.time}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">إدارة المستخدمين</CardTitle>
                    <CardDescription>عرض وإدارة جميع مستخدمي المنصة</CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={showPasswords} 
                        onCheckedChange={setShowPasswords}
                        id="show-passwords"
                      />
                      <label htmlFor="show-passwords" className="text-sm text-gray-300 cursor-pointer">
                        {showPasswords ? 'إخفاء كلمات المرور' : 'إظهار كلمات المرور'}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="البحث بالاسم أو البريد الإلكتروني..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead>المستخدم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>كلمة المرور</TableHead>
                        <TableHead>المتابعون</TableHead>
                        <TableHead>المتابَعون</TableHead>
                        <TableHead>المنشورات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>آخر تسجيل دخول</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-gray-700">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="font-medium">{user.name}</div>
                                {user.verified && (
                                  <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-600 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    موثق
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {showPasswords ? (
                                <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                                  {user.password}
                                </span>
                              ) : (
                                <span className="text-gray-500">••••••••</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="p-1"
                              >
                                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{user.followers.toLocaleString()}</span>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFollowers(user.id, 'increase')}
                                  className="p-1 text-green-400 hover:bg-green-900/20"
                                  title="زيادة المتابعين"
                                >
                                  <UserCheck className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFollowers(user.id, 'decrease')}
                                  className="p-1 text-red-400 hover:bg-red-900/20"
                                  title="تقليل المتابعين"
                                >
                                  <UserX className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.following.toLocaleString()}</TableCell>
                          <TableCell>{user.posts}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.status === 'active' ? 'default' : 'destructive'}
                              className={user.status === 'active' ? 'bg-green-900/20 text-green-400 border-green-600' : ''}
                            >
                              {user.status === 'active' ? 'نشط' : 'معلق'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-1 text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-1">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">إدارة المحتوى</CardTitle>
                <CardDescription>مراجعة وإدارة المنشورات والتقارير</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead>الكاتب</TableHead>
                        <TableHead>المحتوى</TableHead>
                        <TableHead>الإعجابات</TableHead>
                        <TableHead>التعليقات</TableHead>
                        <TableHead>المشاركات</TableHead>
                        <TableHead>التقارير</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.map((post) => (
                        <TableRow key={post.id} className="border-gray-700">
                          <TableCell className="font-medium">{post.author}</TableCell>
                          <TableCell className="max-w-xs truncate">{post.content}</TableCell>
                          <TableCell>{post.likes}</TableCell>
                          <TableCell>{post.comments}</TableCell>
                          <TableCell>{post.shares}</TableCell>
                          <TableCell>
                            {post.reports > 0 && (
                              <Badge variant="destructive" className="bg-red-900/20 text-red-400 border-red-600">
                                {post.reports}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={post.status === 'published' ? 'default' : 'secondary'}
                              className={post.status === 'published' ? 'bg-green-900/20 text-green-400 border-green-600' : 'bg-yellow-900/20 text-yellow-400 border-yellow-600'}
                            >
                              {post.status === 'published' ? 'منشور' : 'قيد المراجعة'}
                            </Badge>
                          </TableCell>
                          <TableCell>{post.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="p-1">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-1">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-1 text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>نمو المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-400">
                    الرسوم البيانية ستظهر هنا بعد ربط قاعدة البيانات
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>نشاط المنصة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-gray-400">
                    إحصائيات التفاعل ستظهر هنا
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-400" />
                    إعدادات النظام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">السماح بتسجيل مستخدمين جدد</div>
                      <div className="text-sm text-gray-400">تمكين أو تعطيل تسجيل حسابات جديدة</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">مراجعة المحتوى تلقائياً</div>
                      <div className="text-sm text-gray-400">فحص المنشورات قبل النشر</div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">إشعارات البريد الإلكتروني</div>
                      <div className="text-sm text-gray-400">إرسال إشعارات للمطورين</div>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">الوضع الليلي الإجباري</div>
                      <div className="text-sm text-gray-400">فرض المظهر الداكن لجميع المستخدمين</div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-base">النسخ الاحتياطي التلقائي</div>
                      <div className="text-sm text-gray-400">حفظ نسخة احتياطية يومياً</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Languages className="w-5 h-5 mr-2 text-indigo-400" />
                    إعدادات اللغة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">اللغة الافتراضية للمنصة</label>
                    <Select defaultValue="ar">
                      <SelectTrigger className="mt-2 bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center space-x-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">اللغات المدعومة</label>
                    {languages.map((lang) => (
                      <div key={lang.code} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                        <Switch defaultChecked={lang.code === 'ar' || lang.code === 'en'} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;