import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Database, 
  Settings as SettingsIcon, 
  Lock,
  Eye,
  Key,
  AlertTriangle,
  CheckCircle2,
  Users as UsersIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DatabaseStats {
  users: number;
  profiles: number;
  posts: number;
  reels: number;
  comments: number;
  likes: number;
  follows: number;
  stories: number;
  messages: number;
}

interface SystemSettings {
  maintenanceMode: boolean;
  allowSignups: boolean;
  requireEmailVerification: boolean;
  maxPostsPerDay: number;
  maxFollowsPerDay: number;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    users: 0,
    profiles: 0,
    posts: 0,
    reels: 0,
    comments: 0,
    likes: 0,
    follows: 0,
    stories: 0,
    messages: 0,
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: false,
    maxPostsPerDay: 50,
    maxFollowsPerDay: 100,
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "يجب أن تكون مسؤولاً للوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      setIsAuthorized(true);
      await loadDatabaseStats();
    } catch (error) {
      console.error('Authorization error:', error);
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const [
        usersCount,
        profilesCount,
        postsCount,
        reelsCount,
        commentsCount,
        likesCount,
        followsCount,
        storiesCount,
        messagesCount,
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reels').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        supabase.from('follows').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);

      setDbStats({
        users: usersCount.count || 0,
        profiles: profilesCount.count || 0,
        posts: postsCount.count || 0,
        reels: reelsCount.count || 0,
        comments: commentsCount.count || 0,
        likes: likesCount.count || 0,
        follows: followsCount.count || 0,
        stories: storiesCount.count || 0,
        messages: messagesCount.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الإحصائيات',
        variant: 'destructive',
      });
    }
  };

  const handleClearTable = async (tableName: keyof DatabaseStats) => {
    try {
      // This would require a custom edge function for security
      toast({
        title: 'تحذير',
        description: 'هذه الميزة تحتاج إلى إعداد خاص للأمان',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error clearing table:', error);
      toast({
        title: 'خطأ',
        description: 'فشل مسح البيانات',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async (tableName: keyof DatabaseStats) => {
    try {
      // Map table names to actual database table names
      const tableMapping: Record<keyof DatabaseStats, string> = {
        users: 'user_roles',
        profiles: 'profiles',
        posts: 'posts',
        reels: 'reels',
        comments: 'comments',
        likes: 'likes',
        follows: 'follows',
        stories: 'stories',
        messages: 'messages',
      };

      const actualTableName = tableMapping[tableName];
      const { data, error } = await supabase
        .from(actualTableName as any)
        .select('*');

      if (error) throw error;

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'نجح',
        description: `تم تصدير بيانات ${tableName}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تصدير البيانات',
        variant: 'destructive',
      });
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
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      
      <main className="pt-20 pb-8">
        <div className="container-responsive mobile-padding">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="mb-4 text-gray-400 hover:text-white"
            >
              ← العودة للوحة التحكم
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <SettingsIcon className="w-8 h-8 text-primary" />
              إعدادات النظام المتقدمة
            </h1>
            <p className="text-gray-400">التحكم الكامل بقاعدة البيانات والنظام</p>
          </div>

          <Tabs defaultValue="database" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900">
              <TabsTrigger value="database" className="data-[state=active]:bg-primary">
                <Database className="w-4 h-4 mr-2" />
                قاعدة البيانات
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-primary">
                <SettingsIcon className="w-4 h-4 mr-2" />
                إعدادات النظام
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-primary">
                <Shield className="w-4 h-4 mr-2" />
                الأمان
              </TabsTrigger>
            </TabsList>

            {/* Database Management */}
            <TabsContent value="database" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    إحصائيات قاعدة البيانات
                  </CardTitle>
                  <CardDescription>نظرة شاملة على البيانات المخزنة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(dbStats).map(([key, value]) => (
                      <div key={key} className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1 capitalize">
                          {key === 'users' ? 'المستخدمين' :
                           key === 'profiles' ? 'الملفات الشخصية' :
                           key === 'posts' ? 'المنشورات' :
                           key === 'reels' ? 'الريلز' :
                           key === 'comments' ? 'التعليقات' :
                           key === 'likes' ? 'الإعجابات' :
                           key === 'follows' ? 'المتابعات' :
                           key === 'stories' ? 'القصص' :
                           key === 'messages' ? 'الرسائل' : key}
                        </p>
                        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">إدارة الجداول</CardTitle>
                  <CardDescription>تصدير أو مسح بيانات الجداول</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(Object.keys(dbStats) as Array<keyof DatabaseStats>).map((table) => (
                      <div key={table} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div>
                          <h3 className="text-white font-semibold capitalize">{table}</h3>
                          <p className="text-gray-400 text-sm">{dbStats[table]} سجل</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportData(table)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            تصدير
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                مسح
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم حذف جميع بيانات {table} بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
                                  إلغاء
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleClearTable(table)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  نعم، احذف الكل
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">إعدادات التطبيق</CardTitle>
                  <CardDescription>التحكم في سلوك النظام</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance" className="text-white text-base">
                        وضع الصيانة
                      </Label>
                      <p className="text-gray-400 text-sm">إيقاف الوصول للتطبيق مؤقتاً</p>
                    </div>
                    <Switch
                      id="maintenance"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="signups" className="text-white text-base">
                        السماح بالتسجيل
                      </Label>
                      <p className="text-gray-400 text-sm">تمكين المستخدمين الجدد من التسجيل</p>
                    </div>
                    <Switch
                      id="signups"
                      checked={systemSettings.allowSignups}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, allowSignups: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-verify" className="text-white text-base">
                        التحقق من البريد الإلكتروني
                      </Label>
                      <p className="text-gray-400 text-sm">طلب تأكيد البريد عند التسجيل</p>
                    </div>
                    <Switch
                      id="email-verify"
                      checked={systemSettings.requireEmailVerification}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, requireEmailVerification: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-posts" className="text-white">
                      الحد الأقصى للمنشورات يومياً
                    </Label>
                    <Input
                      id="max-posts"
                      type="number"
                      value={systemSettings.maxPostsPerDay}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, maxPostsPerDay: parseInt(e.target.value) })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-follows" className="text-white">
                      الحد الأقصى للمتابعات يومياً
                    </Label>
                    <Input
                      id="max-follows"
                      type="number"
                      value={systemSettings.maxFollowsPerDay}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, maxFollowsPerDay: parseInt(e.target.value) })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    حفظ الإعدادات
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    إعدادات الأمان
                  </CardTitle>
                  <CardDescription>حماية النظام والبيانات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="text-yellow-500 font-semibold mb-1">تحذير أمني</h4>
                        <p className="text-gray-300 text-sm">
                          تأكد من تفعيل جميع إعدادات الأمان للحفاظ على سلامة البيانات.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="w-4 h-4 mr-2" />
                      تفعيل المصادقة الثنائية للمسؤولين
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="w-4 h-4 mr-2" />
                      تغيير مفاتيح API
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      مراجعة صلاحيات المستخدمين
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">سجل الأنشطة</CardTitle>
                  <CardDescription>آخر العمليات الإدارية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-white text-sm">تم تسجيل دخول مسؤول جديد</p>
                          <p className="text-gray-400 text-xs">منذ 5 دقائق</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-white text-sm">تم تحديث إعدادات النظام</p>
                          <p className="text-gray-400 text-xs">منذ ساعة</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="text-white text-sm">تم تصدير بيانات المستخدمين</p>
                          <p className="text-gray-400 text-xs">منذ 3 ساعات</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
