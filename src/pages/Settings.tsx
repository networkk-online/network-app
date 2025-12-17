import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, 
  Briefcase, 
  BarChart3, 
  CreditCard, 
  Lock, 
  Users, 
  Ban, 
  MapPin, 
  MessageCircle, 
  AtSign, 
  MessageSquare, 
  Share2, 
  UserX, 
  Type, 
  VolumeX, 
  Settings2,
  ChevronLeft
} from 'lucide-react';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

const SettingItem = ({ icon, title, subtitle, onClick, hasSwitch, switchValue, onSwitchChange }: SettingItemProps) => (
  <div 
    className={`flex items-center justify-between py-3 ${onClick ? 'cursor-pointer hover:bg-gray-900/50' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <div className="text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-white text-sm">{title}</p>
        {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      </div>
    </div>
    {hasSwitch ? (
      <Switch
        checked={switchValue}
        onCheckedChange={onSwitchChange}
      />
    ) : onClick ? (
      <ChevronLeft className="w-5 h-5 text-gray-500" />
    ) : null}
  </div>
);

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-green-500 text-sm font-medium mb-2 px-1">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
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

  const handleToggle = async (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (userId) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            ...settings,
            [key]: value,
          });
      } catch (error) {
        console.error('Error saving setting:', error);
      }
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
      
      <main className="pt-20 pb-24">
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

            {/* للمحترفين */}
            <SettingSection title="للمحترفين">
              <SettingItem
                icon={<Briefcase className="w-5 h-5" />}
                title="حساب احترافي"
                onClick={() => navigate('/business-account')}
              />
              <SettingItem
                icon={<BarChart3 className="w-5 h-5" />}
                title="أدوات وعناصر تحكم المنشئ"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<CreditCard className="w-5 h-5" />}
                title="مدفوعات الإعلانات"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
            </SettingSection>

            {/* من يمكنه رؤية محتواك */}
            <SettingSection title="من يمكنه رؤية محتواك">
              <SettingItem
                icon={<Lock className="w-5 h-5" />}
                title="خصوصية الحساب"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<Users className="w-5 h-5" />}
                title="الأصدقاء المقربون"
                onClick={() => navigate('/profile')}
              />
              <SettingItem
                icon={<Ban className="w-5 h-5" />}
                title="محظور"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<MapPin className="w-5 h-5" />}
                title="القصة والموقع"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
            </SettingSection>

            {/* كيف يمكن للآخرين التفاعل معك */}
            <SettingSection title="كيف يمكن للآخرين التفاعل معك">
              <SettingItem
                icon={<MessageCircle className="w-5 h-5" />}
                title="الرسائل وردود القصص"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<AtSign className="w-5 h-5" />}
                title="الوسوم والإشارات"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<MessageSquare className="w-5 h-5" />}
                title="التعليقات"
                hasSwitch
                switchValue={settings.comments_enabled}
                onSwitchChange={(value) => handleToggle('comments_enabled', value)}
              />
              <SettingItem
                icon={<Share2 className="w-5 h-5" />}
                title="المشاركة وإعادة الاستخدام"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<UserX className="w-5 h-5" />}
                title="الحسابات المقيدة"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<Type className="w-5 h-5" />}
                title="الكلمات المخفية"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
            </SettingSection>

            {/* ما تراه */}
            <SettingSection title="ما تراه">
              <SettingItem
                icon={<VolumeX className="w-5 h-5" />}
                title="الحسابات المكتومة"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
              <SettingItem
                icon={<Settings2 className="w-5 h-5" />}
                title="تفضيلات المحتوى"
                onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })}
              />
            </SettingSection>

            {/* الإشعارات */}
            <SettingSection title="الإشعارات">
              <SettingItem
                icon={<MessageCircle className="w-5 h-5" />}
                title="السماح بالرسائل من غير الأصدقاء"
                hasSwitch
                switchValue={settings.allow_messages_from_non_friends}
                onSwitchChange={(value) => handleToggle('allow_messages_from_non_friends', value)}
              />
              <SettingItem
                icon={<MessageSquare className="w-5 h-5" />}
                title="إشعارات الإعجابات"
                hasSwitch
                switchValue={settings.likes_notifications}
                onSwitchChange={(value) => handleToggle('likes_notifications', value)}
              />
              <SettingItem
                icon={<Users className="w-5 h-5" />}
                title="إشعارات المتابعة"
                hasSwitch
                switchValue={settings.follows_notifications}
                onSwitchChange={(value) => handleToggle('follows_notifications', value)}
              />
            </SettingSection>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
