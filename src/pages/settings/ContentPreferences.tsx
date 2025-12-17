import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Settings2, Eye, AlertTriangle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const ContentPreferences = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    show_likes_count: true,
    sensitive_content: false,
    suggested_posts: true,
    autoplay_videos: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('content_preferences');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('content_preferences', JSON.stringify(updated));
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
          <h1 className="text-xl font-bold">تفضيلات المحتوى</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          خصص تجربة المحتوى الخاصة بك
        </p>

        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">إظهار عدد الإعجابات</p>
                <p className="text-sm text-muted-foreground">
                  عرض عدد الإعجابات على المنشورات
                </p>
              </div>
            </div>
            <Switch
              checked={settings.show_likes_count}
              onCheckedChange={(v) => handleToggle('show_likes_count', v)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">المحتوى الحساس</p>
                  <p className="text-sm text-muted-foreground">
                    إظهار المحتوى الذي قد يكون حساساً
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.sensitive_content}
                onCheckedChange={(v) => handleToggle('sensitive_content', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">المنشورات المقترحة</p>
                  <p className="text-sm text-muted-foreground">
                    إظهار منشورات من حسابات قد تعجبك
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.suggested_posts}
                onCheckedChange={(v) => handleToggle('suggested_posts', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">التشغيل التلقائي للفيديو</p>
                  <p className="text-sm text-muted-foreground">
                    تشغيل الفيديوهات تلقائياً أثناء التمرير
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.autoplay_videos}
                onCheckedChange={(v) => handleToggle('autoplay_videos', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPreferences;
