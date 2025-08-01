import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  LogIn
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin credentials - في التطبيق الحقيقي ستكون في قاعدة البيانات
  const adminCredentials = {
    username: 'admin',
    password: 'admin123'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === adminCredentials.username && 
        loginForm.password === adminCredentials.password) {
      setIsAuthenticated(true);
      setLoginError('');
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

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="container-responsive">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">لوحة التحكم الإدارية</h1>
            <p className="text-gray-400">إدارة شاملة للمنصة والمستخدمين</p>
          </div>
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              إدارة المستخدمين
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-700">
              <FileText className="w-4 h-4 mr-2" />
              إدارة المحتوى
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>إدارة إعدادات المنصة العامة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">تفعيل التسجيل الجديد</h4>
                    <p className="text-sm text-gray-400">السماح للمستخدمين الجدد بإنشاء حسابات</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">المراجعة التلقائية للمحتوى</h4>
                    <p className="text-sm text-gray-400">فحص المنشورات تلقائياً قبل النشر</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">إشعارات البريد الإلكتروني</h4>
                    <p className="text-sm text-gray-400">إرسال إشعارات للمدراء عند التقارير</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;