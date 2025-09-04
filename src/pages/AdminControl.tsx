import { useState } from 'react';
import { 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Shield, 
  AlertTriangle,
  MessageSquare,
  Video,
  TrendingUp,
  UserCheck,
  Ban,
  Crown,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Activity,
  Plus,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const AdminControl = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);

  const stats = [
    { label: 'إجمالي المستخدمين', value: '12,487', icon: Users, change: '+12%', color: 'text-blue-400' },
    { label: 'المنشورات اليوم', value: '1,234', icon: FileText, change: '+8%', color: 'text-green-400' },
    { label: 'البلاغات المعلقة', value: '23', icon: AlertTriangle, change: '-5%', color: 'text-yellow-400' },
    { label: 'الإيرادات', value: '$45,678', icon: TrendingUp, change: '+15%', color: 'text-purple-400' },
  ];

  const adminUsers = [
    { 
      id: 1, 
      name: 'أحمد محمد الأحمد', 
      email: 'ahmed@network.com', 
      role: 'مدير عام', 
      permissions: ['إدارة شاملة'], 
      status: 'نشط', 
      lastLogin: 'منذ 5 دقائق',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      canManageUsers: true,
      canManageContent: true,
      canViewReports: true,
      canManageSettings: true,
      canManageAdmins: true
    },
    { 
      id: 2, 
      name: 'فاطمة علي السعد', 
      email: 'fatima@network.com', 
      role: 'مشرفة محتوى', 
      permissions: ['إدارة المحتوى', 'البلاغات'], 
      status: 'نشط', 
      lastLogin: 'منذ ساعة',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=40&h=40&fit=crop&crop=face',
      canManageUsers: false,
      canManageContent: true,
      canViewReports: true,
      canManageSettings: false,
      canManageAdmins: false
    },
    { 
      id: 3, 
      name: 'محمد خالد العتيبي', 
      email: 'mohammed@network.com', 
      role: 'مشرف مستخدمين', 
      permissions: ['إدارة المستخدمين'], 
      status: 'غير متصل', 
      lastLogin: 'منذ يوم',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      canManageUsers: true,
      canManageContent: false,
      canViewReports: false,
      canManageSettings: false,
      canManageAdmins: false
    },
  ];

  const recentActivity = [
    { user: 'أحمد محمد', action: 'نشر محتوى جديد', time: 'منذ 5 دقائق', type: 'post' },
    { user: 'فاطمة علي', action: 'تقديم بلاغ', time: 'منذ 15 دقيقة', type: 'report' },
    { user: 'محمد أحمد', action: 'تسجيل دخول', time: 'منذ 30 دقيقة', type: 'login' },
    { user: 'سارة خالد', action: 'رفع فيديو', time: 'منذ ساعة', type: 'video' },
  ];

  const rolesAndPermissions = [
    {
      role: 'مدير عام',
      description: 'صلاحيات كاملة لإدارة المنصة',
      permissions: ['إدارة المستخدمين', 'إدارة المحتوى', 'البلاغات', 'التحليلات', 'الإعدادات', 'إدارة المشرفين'],
      color: 'bg-red-600'
    },
    {
      role: 'مشرف محتوى',
      description: 'إدارة المحتوى والبلاغات',
      permissions: ['إدارة المحتوى', 'البلاغات', 'التحليلات'],
      color: 'bg-blue-600'
    },
    {
      role: 'مشرف مستخدمين',
      description: 'إدارة حسابات المستخدمين',
      permissions: ['إدارة المستخدمين'],
      color: 'bg-green-600'
    },
    {
      role: 'مشرف تقني',
      description: 'إدارة الإعدادات التقنية',
      permissions: ['الإعدادات', 'التحليلات'],
      color: 'bg-purple-600'
    }
  ];

  const filteredAdmins = adminUsers.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDashboard = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-green-400">
                {stat.change} من الشهر الماضي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Management Options */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Crown className="w-5 h-5 ml-2 text-yellow-400" />
                أدوات الإدارة المتقدمة
              </CardTitle>
              <CardDescription>إدارة شاملة للمنصة والمحتوى</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-purple-500 hover:bg-purple-500/10 transition-all"
                  onClick={() => setSelectedTab('admins')}
                >
                  <Shield className="w-6 h-6 mb-2 text-purple-400" />
                  <span className="text-sm">إدارة المشرفين</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all">
                  <Users className="w-6 h-6 mb-2 text-blue-400" />
                  <span className="text-sm">إدارة المستخدمين</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-green-500 hover:bg-green-500/10 transition-all">
                  <MessageSquare className="w-6 h-6 mb-2 text-green-400" />
                  <span className="text-sm">إدارة المحتوى</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all">
                  <AlertTriangle className="w-6 h-6 mb-2 text-yellow-400" />
                  <span className="text-sm">البلاغات</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-pink-500 hover:bg-pink-500/10 transition-all">
                  <BarChart3 className="w-6 h-6 mb-2 text-pink-400" />
                  <span className="text-sm">التحليلات</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto border-gray-700 hover:border-gray-500 hover:bg-gray-500/10 transition-all">
                  <Settings className="w-6 h-6 mb-2 text-gray-400" />
                  <span className="text-sm">الإعدادات</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 ml-2 text-green-400" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <UserCheck className="w-4 h-4 mr-2" />
                  تفعيل مستخدم
                </Button>
                <Button size="sm" variant="destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  حظر مستخدم
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setSelectedTab('admins')}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  ترقية لمشرف
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="w-4 h-4 mr-2" />
                  إعدادات المنصة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 ml-2 text-blue-400" />
                النشاط الأخير
              </CardTitle>
              <CardDescription>آخر الأنشطة على المنصة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      {activity.type === 'post' && <FileText className="w-4 h-4 text-blue-400" />}
                      {activity.type === 'report' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                      {activity.type === 'login' && <UserCheck className="w-4 h-4 text-green-400" />}
                      {activity.type === 'video' && <Video className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {activity.action}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );

  const AddAdminDialog = () => (
    <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 ml-2 text-purple-400" />
            إضافة مشرف جديد
          </DialogTitle>
          <DialogDescription>
            إنشاء حساب مشرف جديد وتحديد صلاحياته
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">الاسم الكامل</label>
              <Input placeholder="أدخل الاسم الكامل" className="bg-gray-800 border-gray-600" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">البريد الإلكتروني</label>
              <Input placeholder="أدخل البريد الإلكتروني" className="bg-gray-800 border-gray-600" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">الدور</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between border-gray-600">
                  اختر الدور
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-gray-800 border-gray-700">
                {rolesAndPermissions.map((role, index) => (
                  <DropdownMenuItem key={index} className="text-white hover:bg-gray-700">
                    <div className={`w-3 h-3 rounded-full ${role.color} ml-2`}></div>
                    {role.role}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">الصلاحيات</label>
            <div className="space-y-3">
              {['إدارة المستخدمين', 'إدارة المحتوى', 'البلاغات', 'التحليلات', 'الإعدادات', 'إدارة المشرفين'].map((permission, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox id={`permission-${index}`} />
                  <label htmlFor={`permission-${index}`} className="text-sm text-gray-300">
                    {permission}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button variant="outline" onClick={() => setShowAddAdminDialog(false)} className="border-gray-600">
              إلغاء
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              إنشاء المشرف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderAdminManagement = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">إدارة المشرفين والصلاحيات</h2>
          <p className="text-gray-400">إدارة المديرين والمشرفين وصلاحياتهم</p>
        </div>
        <Button 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={() => setShowAddAdminDialog(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          إضافة مشرف جديد
        </Button>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {rolesAndPermissions.map((role, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                <CardTitle className="text-sm text-white">{role.role}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-400 mb-3">{role.description}</p>
              <div className="space-y-1">
                {role.permissions.slice(0, 3).map((permission, idx) => (
                  <div key={idx} className="text-xs text-gray-500">• {permission}</div>
                ))}
                {role.permissions.length > 3 && (
                  <div className="text-xs text-gray-500">+ {role.permissions.length - 3} المزيد</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="البحث عن مشرف..."
                className="bg-gray-800 border-gray-700 text-white pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700">
                  <Filter className="w-4 h-4 mr-2" />
                  تصفية حسب الدور
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem className="text-white hover:bg-gray-700">الكل</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">مدير عام</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">مشرف محتوى</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">مشرف مستخدمين</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">قائمة المشرفين ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">المشرف</TableHead>
                <TableHead className="text-gray-300">الدور</TableHead>
                <TableHead className="text-gray-300">الصلاحيات</TableHead>
                <TableHead className="text-gray-300">الحالة</TableHead>
                <TableHead className="text-gray-300">آخر دخول</TableHead>
                <TableHead className="text-gray-300">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className="border-gray-700">
                  <TableCell>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <img 
                        src={admin.avatar} 
                        alt={admin.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{admin.name}</div>
                        <div className="text-sm text-gray-400">{admin.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-purple-500 text-purple-400">
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={admin.status === 'نشط' ? 'default' : 'secondary'}
                      className={admin.status === 'نشط' ? 'bg-green-600' : 'bg-gray-600'}
                    >
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {admin.lastLogin}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline" className="border-gray-700 hover:border-blue-500">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-700 hover:border-red-500 text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 ml-2 text-purple-400" />
            مصفوفة الصلاحيات المتقدمة
          </CardTitle>
          <CardDescription>إدارة تفصيلية للصلاحيات لكل دور</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-right text-sm font-medium text-gray-300 p-3">الصلاحية</th>
                  <th className="text-center text-sm font-medium text-gray-300 p-3">مدير عام</th>
                  <th className="text-center text-sm font-medium text-gray-300 p-3">مشرف محتوى</th>
                  <th className="text-center text-sm font-medium text-gray-300 p-3">مشرف مستخدمين</th>
                  <th className="text-center text-sm font-medium text-gray-300 p-3">مشرف تقني</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'إدارة المستخدمين', icon: Users },
                  { name: 'إدارة المحتوى', icon: FileText },
                  { name: 'مراجعة البلاغات', icon: AlertTriangle },
                  { name: 'عرض التحليلات', icon: BarChart3 },
                  { name: 'إدارة الإعدادات', icon: Settings },
                  { name: 'إدارة المشرفين', icon: Crown },
                  { name: 'حذف المحتوى', icon: Trash2 },
                  { name: 'حظر المستخدمين', icon: Ban }
                ].map((permission, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="p-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <permission.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">{permission.name}</span>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Switch defaultChecked />
                    </td>
                    <td className="text-center p-3">
                      <Switch defaultChecked={index < 4} />
                    </td>
                    <td className="text-center p-3">
                      <Switch defaultChecked={index === 0 || index === 6 || index === 7} />
                    </td>
                    <td className="text-center p-3">
                      <Switch defaultChecked={index === 3 || index === 4} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
            <Button variant="outline" className="border-gray-600">
              إعادة تعيين
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              حفظ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold neon-text mb-2 flex items-center">
                <Crown className="w-8 h-8 ml-3 text-yellow-400" />
                لوحة التحكم الشاملة
              </h1>
              <p className="text-gray-400">إدارة متكاملة للمنصة والمحتوى</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">🇸🇦 العربية</span>
              </div>
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                <Crown className="w-4 h-4 mr-2" />
                مدير النظام
              </Badge>
              <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500/10">
                تسجيل خروج
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mt-6 flex space-x-4 space-x-reverse border-b border-gray-800">
            <button
              onClick={() => setSelectedTab('dashboard')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'dashboard'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              لوحة المعلومات
            </button>
            <button
              onClick={() => setSelectedTab('admins')}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'admins'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              إدارة المشرفين والصلاحيات
            </button>
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'dashboard' && renderDashboard()}
        {selectedTab === 'admins' && renderAdminManagement()}
        
        {/* Add Admin Dialog */}
        <AddAdminDialog />
      </div>
    </div>
  );
};

export default AdminControl;