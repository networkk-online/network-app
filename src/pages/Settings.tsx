import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowRight, Briefcase, BarChart3, CreditCard, Lock, Users, Ban, MapPin, 
  MessageCircle, AtSign, MessageSquare, Share2, UserX, Type, VolumeX, Settings2,
  ChevronLeft, Download, Accessibility, Globe, Monitor, UserCheck, BriefcaseBusiness,
  Shield, UserCog, Bell, LogOut, Radio, Phone, Video, Moon, BellRing
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
    className={`flex items-center justify-between py-3.5 px-4 rounded-2xl transition-all duration-200 ${onClick ? 'cursor-pointer hover:bg-white/[0.03] active:scale-[0.98]' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3.5">
      <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06]"
           style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}>
        <div className="text-white/40">{icon}</div>
      </div>
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-white/25 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {hasSwitch ? (
      <Switch checked={switchValue} onCheckedChange={onSwitchChange} />
    ) : onClick ? (
      <ChevronLeft className="w-4 h-4 text-white/20" strokeWidth={1.4} />
    ) : null}
  </div>
);

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="text-primary/60 text-xs font-medium mb-2 px-4 tracking-wider uppercase">{title}</h3>
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden"
         style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 0 rgba(255,255,255,0.03)' }}>
      {children}
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState({
    likes_enabled: true, comments_enabled: true, notifications_enabled: true,
    likes_notifications: true, comments_notifications: true, follows_notifications: true,
    allow_messages_from_non_friends: true, auto_backup_enabled: false,
  });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "يجب تسجيل الدخول", description: "سجل دخولك للوصول إلى الإعدادات", variant: "destructive" }); navigate('/login'); return; }
    setUserId(user.id);
    await loadSettings(user.id);
  };

  const loadSettings = async (uid: string) => {
    try {
      const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', uid).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({
          likes_enabled: data.likes_enabled ?? true, comments_enabled: data.comments_enabled ?? true,
          notifications_enabled: data.notifications_enabled ?? true, likes_notifications: data.likes_notifications ?? true,
          comments_notifications: data.comments_notifications ?? true, follows_notifications: data.follows_notifications ?? true,
          allow_messages_from_non_friends: data.allow_messages_from_non_friends ?? true, auto_backup_enabled: data.auto_backup_enabled ?? false,
        });
      }
    } catch (error) { console.error('Error loading settings:', error); }
    finally { setLoading(false); }
  };

  const handleToggle = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (userId) {
      try { await supabase.from('user_settings').upsert({ user_id: userId, ...settings, [key]: value }); }
      catch (error) { console.error('Error saving setting:', error); }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "تم تسجيل الخروج", description: "تم تسجيل خروجك بنجاح" });
      navigate('/login');
    } catch (error) { console.error('Error signing out:', error); toast({ title: "خطأ", description: "فشل تسجيل الخروج", variant: "destructive" }); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20 pb-8"><div className="text-center text-white/20">جاري التحميل...</div></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-20 pb-24">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-white/40 hover:text-white/70 hover:bg-white/[0.03] rounded-full">
                <ArrowRight className="w-5 h-5" strokeWidth={1.4} />
              </Button>
              <h1 className="text-xl font-bold text-white/95 mr-4 tracking-wide">الإعدادات</h1>
            </div>

            <SettingSection title="للمحترفين">
              <SettingItem icon={<Briefcase className="w-4 h-4" strokeWidth={1.4} />} title="حساب احترافي" onClick={() => navigate('/business-account')} />
              <SettingItem icon={<BarChart3 className="w-4 h-4" strokeWidth={1.4} />} title="أدوات وعناصر تحكم المنشئ" onClick={() => navigate('/settings/creator-tools')} />
              <SettingItem icon={<CreditCard className="w-4 h-4" strokeWidth={1.4} />} title="مدفوعات الإعلانات" onClick={() => navigate('/withdraw')} />
            </SettingSection>

            <SettingSection title="من يمكنه رؤية محتواك">
              <SettingItem icon={<Lock className="w-4 h-4" strokeWidth={1.4} />} title="خصوصية الحساب" onClick={() => navigate('/settings/privacy')} />
              <SettingItem icon={<Users className="w-4 h-4" strokeWidth={1.4} />} title="الأصدقاء المقربون" onClick={() => navigate('/profile')} />
              <SettingItem icon={<Ban className="w-4 h-4" strokeWidth={1.4} />} title="محظور" onClick={() => navigate('/settings/blocked')} />
              <SettingItem icon={<MapPin className="w-4 h-4" strokeWidth={1.4} />} title="القصة والموقع" onClick={() => navigate('/settings/story-location')} />
            </SettingSection>

            <SettingSection title="كيف يمكن للآخرين التفاعل معك">
              <SettingItem icon={<MessageCircle className="w-4 h-4" strokeWidth={1.4} />} title="الرسائل وردود القصص" onClick={() => navigate('/settings/messages')} />
              <SettingItem icon={<AtSign className="w-4 h-4" strokeWidth={1.4} />} title="الوسوم والإشارات" onClick={() => navigate('/settings/tags-mentions')} />
              <SettingItem icon={<MessageSquare className="w-4 h-4" strokeWidth={1.4} />} title="التعليقات" hasSwitch switchValue={settings.comments_enabled} onSwitchChange={(v) => handleToggle('comments_enabled', v)} />
              <SettingItem icon={<Share2 className="w-4 h-4" strokeWidth={1.4} />} title="المشاركة وإعادة الاستخدام" onClick={() => navigate('/settings/sharing')} />
              <SettingItem icon={<UserX className="w-4 h-4" strokeWidth={1.4} />} title="الحسابات المقيدة" onClick={() => navigate('/settings/restricted')} />
              <SettingItem icon={<Type className="w-4 h-4" strokeWidth={1.4} />} title="الكلمات المخفية" onClick={() => navigate('/settings/hidden-words')} />
            </SettingSection>

            <SettingSection title="ما تراه">
              <SettingItem icon={<VolumeX className="w-4 h-4" strokeWidth={1.4} />} title="الحسابات المكتومة" onClick={() => navigate('/settings/muted')} />
              <SettingItem icon={<Settings2 className="w-4 h-4" strokeWidth={1.4} />} title="تفضيلات المحتوى" onClick={() => navigate('/settings/content')} />
            </SettingSection>

            <SettingSection title="إعدادات المحتوى">
              <SettingItem icon={<MessageSquare className="w-4 h-4" strokeWidth={1.4} />} title="إعدادات المنشورات" onClick={() => navigate('/settings/posts')} />
              <SettingItem icon={<Settings2 className="w-4 h-4" strokeWidth={1.4} />} title="إعدادات الريلز" onClick={() => navigate('/settings/reels')} />
            </SettingSection>

            <SettingSection title="الإشعارات">
              <SettingItem icon={<Bell className="w-4 h-4" strokeWidth={1.4} />} title="إعدادات الإشعارات" onClick={() => navigate('/settings/notifications')} />
            </SettingSection>

            <SettingSection title="تطبيقك ووسائطك">
              <SettingItem icon={<Download className="w-4 h-4" strokeWidth={1.4} />} title="الأرشفة والتنزيل" onClick={() => navigate('/settings/archive')} />
              <SettingItem icon={<Accessibility className="w-4 h-4" strokeWidth={1.4} />} title="إمكانية الوصول" onClick={() => navigate('/settings/accessibility')} />
              <SettingItem icon={<Globe className="w-4 h-4" strokeWidth={1.4} />} title="اللغة" onClick={() => navigate('/settings/language')} />
              <SettingItem icon={<Monitor className="w-4 h-4" strokeWidth={1.4} />} title="أذونات الموقع الإلكتروني" onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })} />
            </SettingSection>

            <SettingSection title="مركز العائلة">
              <SettingItem icon={<UserCheck className="w-4 h-4" strokeWidth={1.4} />} title="الإشراف على حسابات المراهقين" onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })} />
            </SettingSection>

            <SettingSection title="البث المباشر">
              <SettingItem icon={<Radio className="w-4 h-4" strokeWidth={1.4} />} title="إعدادات البث المباشر" subtitle="إدارة إعدادات البث والتبرعات" onClick={() => navigate('/broadcast')} />
            </SettingSection>

            <SettingSection title="المكالمات">
              <SettingItem icon={<Phone className="w-4 h-4" strokeWidth={1.4} />} title="إعدادات المكالمات" subtitle="المكالمات الصوتية والفيديو والخصوصية" onClick={() => navigate('/settings/calls')} />
              <SettingItem icon={<Video className="w-4 h-4" strokeWidth={1.4} />} title="سجل المكالمات" subtitle="عرض المكالمات الواردة والصادرة" onClick={() => navigate('/call-history')} />
            </SettingSection>

            <SettingSection title="مزيد من المعلومات والدعم">
              <SettingItem icon={<BriefcaseBusiness className="w-4 h-4" strokeWidth={1.4} />} title="الوظائف" onClick={() => toast({ title: "قريباً", description: "هذه الميزة قيد التطوير" })} />
              <SettingItem icon={<Shield className="w-4 h-4" strokeWidth={1.4} />} title="مركز الخصوصية" onClick={() => navigate('/settings/privacy-center')} />
              <SettingItem icon={<UserCog className="w-4 h-4" strokeWidth={1.4} />} title="حالة الحساب" onClick={() => navigate('/settings/account-status')} />
            </SettingSection>

            <SettingSection title="تسجيل الخروج">
              <SettingItem icon={<LogOut className="w-4 h-4 text-destructive/60" strokeWidth={1.4} />} title="تسجيل الخروج" subtitle="الخروج من حسابك" onClick={handleLogout} />
            </SettingSection>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
