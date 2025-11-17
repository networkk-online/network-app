import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Heart, MessageCircle, Bell, Shield, Database } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState({
    likes_enabled: true,
    comments_enabled: true,
    notifications_enabled: true,
    likes_notifications: true,
    comments_notifications: true,
    follows_notifications: true,
    allow_messages_from_non_friends: true,
    auto_backup_enabled: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك للوصول إلى الإعدادات",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    setUserId(user.id);
    await loadSettings(user.id);
  };

  const loadSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          likes_enabled: data.likes_enabled ?? true,
          comments_enabled: data.comments_enabled ?? true,
          notifications_enabled: data.notifications_enabled ?? true,
          likes_notifications: data.likes_notifications ?? true,
          comments_notifications: data.comments_notifications ?? true,
          follows_notifications: data.follows_notifications ?? true,
          allow_messages_from_non_friends: data.allow_messages_from_non_friends ?? true,
          auto_backup_enabled: data.auto_backup_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعداداتك بنجاح",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast({
        title: "جاري النسخ الاحتياطي",
        description: "سيتم إشعارك عند اكتمال النسخ الاحتياطي",
      });
      // Implement backup logic here
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء النسخ الاحتياطي",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20 pb-8">
          <div className="text-center text-gray-500">
            جاري التحميل...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-white mr-4">الإعدادات</h1>
            </div>

            <div className="space-y-6">
              {/* Privacy Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Heart className="w-5 h-5 ml-2 text-green-500" />
                    إعدادات الإعجابات
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    تحكم في من يمكنه التفاعل بالإعجاب على منشوراتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">تفعيل الإعجابات</Label>
                      <p className="text-sm text-gray-400">السماح للآخرين بالإعجاب بمنشوراتك</p>
                    </div>
                    <Switch
                      checked={settings.likes_enabled}
                      onCheckedChange={(value) => handleToggle('likes_enabled', value)}
                    />
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">إشعارات الإعجابات</Label>
                      <p className="text-sm text-gray-400">تلقي إشعار عند إعجاب أحدهم بمنشورك</p>
                    </div>
                    <Switch
                      checked={settings.likes_notifications}
                      onCheckedChange={(value) => handleToggle('likes_notifications', value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Comments Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <MessageCircle className="w-5 h-5 ml-2 text-blue-500" />
                    إعدادات التعليقات
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    تحكم في من يمكنه التعليق على منشوراتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">تفعيل التعليقات</Label>
                      <p className="text-sm text-gray-400">السماح للآخرين بالتعليق على منشوراتك</p>
                    </div>
                    <Switch
                      checked={settings.comments_enabled}
                      onCheckedChange={(value) => handleToggle('comments_enabled', value)}
                    />
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">إشعارات التعليقات</Label>
                      <p className="text-sm text-gray-400">تلقي إشعار عند تعليق أحدهم على منشورك</p>
                    </div>
                    <Switch
                      checked={settings.comments_notifications}
                      onCheckedChange={(value) => handleToggle('comments_notifications', value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="w-5 h-5 ml-2 text-yellow-500" />
                    إعدادات الإشعارات
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    اختر أنواع الإشعارات التي تريد استقبالها
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">تفعيل جميع الإشعارات</Label>
                      <p className="text-sm text-gray-400">تلقي جميع أنواع الإشعارات</p>
                    </div>
                    <Switch
                      checked={settings.notifications_enabled}
                      onCheckedChange={(value) => handleToggle('notifications_enabled', value)}
                    />
                  </div>
                  <Separator className="bg-gray-800" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">إشعارات المتابعة</Label>
                      <p className="text-sm text-gray-400">تلقي إشعار عند متابعة أحدهم لك</p>
                    </div>
                    <Switch
                      checked={settings.follows_notifications}
                      onCheckedChange={(value) => handleToggle('follows_notifications', value)}
                      disabled={!settings.notifications_enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-5 h-5 ml-2 text-green-500" />
                    الخصوصية والأمان
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    تحكم في خصوصية حسابك وأمانه
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">السماح بالرسائل من غير الأصدقاء</Label>
                      <p className="text-sm text-gray-400">السماح لأي شخص بإرسال رسائل لك</p>
                    </div>
                    <Switch
                      checked={settings.allow_messages_from_non_friends}
                      onCheckedChange={(value) => handleToggle('allow_messages_from_non_friends', value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Backup Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Database className="w-5 h-5 ml-2 text-purple-500" />
                    النسخ الاحتياطي
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    احفظ نسخة احتياطية من بياناتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">النسخ الاحتياطي التلقائي</Label>
                      <p className="text-sm text-gray-400">نسخ احتياطي تلقائي لبياناتك كل أسبوع</p>
                    </div>
                    <Switch
                      checked={settings.auto_backup_enabled}
                      onCheckedChange={(value) => handleToggle('auto_backup_enabled', value)}
                    />
                  </div>
                  <Separator className="bg-gray-800" />
                  <Button 
                    onClick={handleBackup}
                    variant="outline"
                    className="w-full"
                  >
                    <Database className="w-4 h-4 ml-2" />
                    إنشاء نسخة احتياطية الآن
                  </Button>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
