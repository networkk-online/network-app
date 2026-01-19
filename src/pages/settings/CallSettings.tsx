import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Video, Bell, Shield, Mic, Camera, Lock, Users, Globe, UserCheck, UserX, Volume2, Vibrate, Clock, Eye, EyeOff, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CallSettings {
  voice_calls_enabled: boolean;
  video_calls_enabled: boolean;
  auto_quality: boolean;
  who_can_call: string;
  in_app_notifications: boolean;
  push_notifications: boolean;
  call_sound: boolean;
  vibration: boolean;
  mute_duration: number;
  block_unverified: boolean;
  hide_online_status: boolean;
  hide_call_duration: boolean;
  default_mic_muted: boolean;
  default_camera_off: boolean;
  noise_reduction: boolean;
  echo_cancellation: boolean;
  end_to_end_encryption: boolean;
  prevent_recording: boolean;
  recording_alert: boolean;
}

const CallSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CallSettings>({
    voice_calls_enabled: true,
    video_calls_enabled: true,
    auto_quality: true,
    who_can_call: 'everyone',
    in_app_notifications: true,
    push_notifications: true,
    call_sound: true,
    vibration: true,
    mute_duration: 0,
    block_unverified: false,
    hide_online_status: false,
    hide_call_duration: false,
    default_mic_muted: false,
    default_camera_off: true,
    noise_reduction: true,
    echo_cancellation: true,
    end_to_end_encryption: true,
    prevent_recording: true,
    recording_alert: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('call_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings({
          voice_calls_enabled: data.voice_calls_enabled ?? true,
          video_calls_enabled: data.video_calls_enabled ?? true,
          auto_quality: data.auto_quality ?? true,
          who_can_call: data.who_can_call ?? 'everyone',
          in_app_notifications: data.in_app_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          call_sound: data.call_sound ?? true,
          vibration: data.vibration ?? true,
          mute_duration: data.mute_duration ?? 0,
          block_unverified: data.block_unverified ?? false,
          hide_online_status: data.hide_online_status ?? false,
          hide_call_duration: data.hide_call_duration ?? false,
          default_mic_muted: data.default_mic_muted ?? false,
          default_camera_off: data.default_camera_off ?? true,
          noise_reduction: data.noise_reduction ?? true,
          echo_cancellation: data.echo_cancellation ?? true,
          end_to_end_encryption: data.end_to_end_encryption ?? true,
          prevent_recording: data.prevent_recording ?? true,
          recording_alert: data.recording_alert ?? true,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<CallSettings>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('call_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعدادات بنجاح',
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMuteDuration = (hours: number) => {
    const muteUntil = hours > 0 ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
    saveSettings({ mute_duration: hours });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">إعدادات المكالمات</h1>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Call Types */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" />
            تفعيل المكالمات
          </h2>
          
          <div className="space-y-3 bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-500" />
                <Label>مكالمات صوتية</Label>
              </div>
              <Switch
                checked={settings.voice_calls_enabled}
                onCheckedChange={(checked) => saveSettings({ voice_calls_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-blue-500" />
                <Label>مكالمات فيديو</Label>
              </div>
              <Switch
                checked={settings.video_calls_enabled}
                onCheckedChange={(checked) => saveSettings({ video_calls_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-purple-500" />
                <Label>جودة تلقائية حسب الإنترنت</Label>
              </div>
              <Switch
                checked={settings.auto_quality}
                onCheckedChange={(checked) => saveSettings({ auto_quality: checked })}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Who Can Call */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            من يستطيع الاتصال بك
          </h2>
          
          <div className="bg-card rounded-lg p-4">
            <RadioGroup
              value={settings.who_can_call}
              onValueChange={(value) => saveSettings({ who_can_call: value })}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <RadioGroupItem value="everyone" id="everyone" />
                <Label htmlFor="everyone" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4 text-green-500" />
                  الجميع
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <RadioGroupItem value="friends" id="friends" />
                <Label htmlFor="friends" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4 text-blue-500" />
                  الأصدقاء فقط
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <RadioGroupItem value="followers" id="followers" />
                <Label htmlFor="followers" className="flex items-center gap-2 cursor-pointer">
                  <UserCheck className="h-4 w-4 text-purple-500" />
                  المتابعون فقط
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <RadioGroupItem value="nobody" id="nobody" />
                <Label htmlFor="nobody" className="flex items-center gap-2 cursor-pointer">
                  <UserX className="h-4 w-4 text-red-500" />
                  لا أحد
                </Label>
              </div>
            </RadioGroup>
          </div>
        </section>

        <Separator />

        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Bell className="h-4 w-4" />
            الإشعارات والتنبيهات
          </h2>
          
          <div className="space-y-3 bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-yellow-500" />
                <Label>إشعار داخل التطبيق</Label>
              </div>
              <Switch
                checked={settings.in_app_notifications}
                onCheckedChange={(checked) => saveSettings({ in_app_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-500" />
                <Label>إشعار Push</Label>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => saveSettings({ push_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-green-500" />
                <Label>صوت المكالمة</Label>
              </div>
              <Switch
                checked={settings.call_sound}
                onCheckedChange={(checked) => saveSettings({ call_sound: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5 text-purple-500" />
                <Label>الاهتزاز</Label>
              </div>
              <Switch
                checked={settings.vibration}
                onCheckedChange={(checked) => saveSettings({ vibration: checked })}
              />
            </div>

            <div className="pt-2">
              <Label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                كتم الإشعارات لفترة
              </Label>
              <div className="flex gap-2">
                {[0, 1, 8, 24].map((hours) => (
                  <Button
                    key={hours}
                    variant={settings.mute_duration === hours ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleMuteDuration(hours)}
                  >
                    {hours === 0 ? 'إيقاف' : `${hours}h`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Privacy */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            الحظر والخصوصية
          </h2>
          
          <div className="space-y-3 bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-5 w-5 text-red-500" />
                <Label>حظر الحسابات غير الموثقة</Label>
              </div>
              <Switch
                checked={settings.block_unverified}
                onCheckedChange={(checked) => saveSettings({ block_unverified: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5 text-gray-500" />
                <Label>إخفاء حالة "متصل الآن"</Label>
              </div>
              <Switch
                checked={settings.hide_online_status}
                onCheckedChange={(checked) => saveSettings({ hide_online_status: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <Label>إخفاء مدة المكالمة</Label>
              </div>
              <Switch
                checked={settings.hide_call_duration}
                onCheckedChange={(checked) => saveSettings({ hide_call_duration: checked })}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Audio/Video Settings */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Mic className="h-4 w-4" />
            إعدادات الصوت والفيديو
          </h2>
          
          <div className="space-y-3 bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-red-500" />
                <Label>كتم الصوت تلقائياً عند الرد</Label>
              </div>
              <Switch
                checked={settings.default_mic_muted}
                onCheckedChange={(checked) => saveSettings({ default_mic_muted: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-gray-500" />
                <Label>إيقاف الكاميرا عند البدء</Label>
              </div>
              <Switch
                checked={settings.default_camera_off}
                onCheckedChange={(checked) => saveSettings({ default_camera_off: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-blue-500" />
                <Label>تحسين الصوت (Noise Reduction)</Label>
              </div>
              <Switch
                checked={settings.noise_reduction}
                onCheckedChange={(checked) => saveSettings({ noise_reduction: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-purple-500" />
                <Label>تقليل الصدى (Echo Cancellation)</Label>
              </div>
              <Switch
                checked={settings.echo_cancellation}
                onCheckedChange={(checked) => saveSettings({ echo_cancellation: checked })}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Security */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            الأمان
          </h2>
          
          <div className="space-y-3 bg-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-500" />
                <div>
                  <Label>تشفير من الطرف للطرف</Label>
                  <p className="text-xs text-muted-foreground">E2E Encryption</p>
                </div>
              </div>
              <Switch
                checked={settings.end_to_end_encryption}
                onCheckedChange={(checked) => saveSettings({ end_to_end_encryption: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-500" />
                <Label>منع تسجيل المكالمات</Label>
              </div>
              <Switch
                checked={settings.prevent_recording}
                onCheckedChange={(checked) => saveSettings({ prevent_recording: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-yellow-500" />
                <Label>تنبيه عند محاولة التسجيل</Label>
              </div>
              <Switch
                checked={settings.recording_alert}
                onCheckedChange={(checked) => saveSettings({ recording_alert: checked })}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CallSettingsPage;
