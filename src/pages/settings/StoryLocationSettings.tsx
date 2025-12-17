import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const StoryLocationSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    show_location: true,
    save_to_archive: true,
    allow_sharing: true,
    show_activity_status: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('story_location_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('story_location_settings', JSON.stringify(updated));
    toast({ title: "تم حفظ الإعداد" });
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
          <h1 className="text-xl font-bold">القصة والموقع</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Story Settings */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          <h3 className="font-bold mb-2">إعدادات القصة</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">حفظ في الأرشيف</p>
                <p className="text-sm text-muted-foreground">
                  حفظ القصص تلقائياً بعد انتهائها
                </p>
              </div>
            </div>
            <Switch
              checked={settings.save_to_archive}
              onCheckedChange={(v) => handleToggle('save_to_archive', v)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">السماح بالمشاركة</p>
                  <p className="text-sm text-muted-foreground">
                    السماح للآخرين بمشاركة قصصك
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allow_sharing}
                onCheckedChange={(v) => handleToggle('allow_sharing', v)}
              />
            </div>
          </div>
        </div>

        {/* Location Settings */}
        <div className="bg-card rounded-xl p-4 space-y-4">
          <h3 className="font-bold mb-2">إعدادات الموقع</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">إظهار الموقع</p>
                <p className="text-sm text-muted-foreground">
                  إظهار موقعك في المنشورات والقصص
                </p>
              </div>
            </div>
            <Switch
              checked={settings.show_location}
              onCheckedChange={(v) => handleToggle('show_location', v)}
            />
          </div>
        </div>

        {/* Activity Status */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">حالة النشاط</p>
                <p className="text-sm text-muted-foreground">
                  السماح للآخرين برؤية متى كنت نشطاً
                </p>
              </div>
            </div>
            <Switch
              checked={settings.show_activity_status}
              onCheckedChange={(v) => handleToggle('show_activity_status', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryLocationSettings;
