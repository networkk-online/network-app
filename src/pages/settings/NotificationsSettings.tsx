import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Heart, MessageSquare, Users, AtSign, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const NotificationsSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    likes_notifications: true,
    comments_notifications: true,
    follows_notifications: true,
    mentions_notifications: true,
    live_notifications: true,
    message_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          notifications_enabled: data.notifications_enabled ?? true,
          likes_notifications: data.likes_notifications ?? true,
          comments_notifications: data.comments_notifications ?? true,
          follows_notifications: data.follows_notifications ?? true,
          mentions_notifications: true,
          live_notifications: true,
          message_notifications: true,
        });
      }

      // Load additional settings from localStorage
      const mentions = localStorage.getItem('mentions_notifications');
      const live = localStorage.getItem('live_notifications');
      const messages = localStorage.getItem('message_notifications');

      setSettings(prev => ({
        ...prev,
        mentions_notifications: mentions !== 'false',
        live_notifications: live !== 'false',
        message_notifications: messages !== 'false',
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const dbKeys = ['notifications_enabled', 'likes_notifications', 'comments_notifications', 'follows_notifications'];
    
    if (dbKeys.includes(key) && userId) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            [key]: value,
          });
      } catch (error) {
        console.error('Error saving setting:', error);
      }
    } else {
      localStorage.setItem(key, value.toString());
    }

    toast({ title: "تم حفظ الإعداد" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  const SettingRow = ({ icon: Icon, title, description, settingKey }: { icon: any; title: string; description: string; settingKey: string }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={settings[settingKey as keyof typeof settings]}
        onCheckedChange={(v) => handleToggle(settingKey, v)}
        disabled={!settings.notifications_enabled && settingKey !== 'notifications_enabled'}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">إعدادات الإشعارات</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Master Toggle */}
        <div className="bg-card rounded-xl p-4">
          <SettingRow
            icon={Bell}
            title="تفعيل الإشعارات"
            description="تفعيل أو إيقاف جميع الإشعارات"
            settingKey="notifications_enabled"
          />
        </div>

        {/* Notification Types */}
        <div className="bg-card rounded-xl p-4 space-y-2">
          <h3 className="font-bold mb-2 text-sm text-muted-foreground">أنواع الإشعارات</h3>
          
          <SettingRow
            icon={Heart}
            title="الإعجابات"
            description="عندما يعجب شخص ما بمنشوراتك"
            settingKey="likes_notifications"
          />
          
          <div className="border-t border-border">
            <SettingRow
              icon={MessageSquare}
              title="التعليقات"
              description="عندما يعلق شخص ما على منشوراتك"
              settingKey="comments_notifications"
            />
          </div>
          
          <div className="border-t border-border">
            <SettingRow
              icon={Users}
              title="المتابعات"
              description="عندما يتابعك شخص جديد"
              settingKey="follows_notifications"
            />
          </div>
          
          <div className="border-t border-border">
            <SettingRow
              icon={AtSign}
              title="الإشارات"
              description="عندما يشير إليك شخص ما"
              settingKey="mentions_notifications"
            />
          </div>
          
          <div className="border-t border-border">
            <SettingRow
              icon={Video}
              title="البث المباشر"
              description="عندما يبدأ شخص تتابعه بثاً مباشراً"
              settingKey="live_notifications"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
