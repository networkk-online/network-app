import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Type, Volume2, Eye, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';

const AccessibilitySettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    large_text: false,
    reduce_motion: false,
    high_contrast: false,
    screen_reader: false,
    font_size: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('accessibility_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('accessibility_settings', JSON.stringify(updated));
    toast({ title: "تم حفظ الإعداد" });
  };

  const handleFontSize = (value: number[]) => {
    const updated = { ...settings, font_size: value[0] };
    setSettings(updated);
    localStorage.setItem('accessibility_settings', JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">إمكانية الوصول</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          تخصيص تجربة الاستخدام لتناسب احتياجاتك
        </p>

        {/* Font Size */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Type className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">حجم الخط</p>
              <p className="text-sm text-muted-foreground">{settings.font_size}%</p>
            </div>
          </div>
          <Slider
            value={[settings.font_size]}
            onValueChange={handleFontSize}
            min={75}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>صغير</span>
            <span>كبير</span>
          </div>
        </div>

        {/* Other Settings */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">نص كبير</p>
                <p className="text-sm text-muted-foreground">
                  تكبير حجم النص في جميع أنحاء التطبيق
                </p>
              </div>
            </div>
            <Switch
              checked={settings.large_text}
              onCheckedChange={(v) => handleToggle('large_text', v)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">تقليل الحركة</p>
                  <p className="text-sm text-muted-foreground">
                    تقليل الرسوم المتحركة والتأثيرات
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.reduce_motion}
                onCheckedChange={(v) => handleToggle('reduce_motion', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">تباين عالي</p>
                  <p className="text-sm text-muted-foreground">
                    زيادة التباين لتسهيل القراءة
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.high_contrast}
                onCheckedChange={(v) => handleToggle('high_contrast', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">قارئ الشاشة</p>
                  <p className="text-sm text-muted-foreground">
                    تحسين التوافق مع قارئات الشاشة
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.screen_reader}
                onCheckedChange={(v) => handleToggle('screen_reader', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
