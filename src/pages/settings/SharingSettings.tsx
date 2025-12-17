import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Share2, Download, Link2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const SharingSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    allow_sharing: true,
    allow_download: false,
    allow_reshare_stories: true,
    allow_embed: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('sharing_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('sharing_settings', JSON.stringify(updated));
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
          <h1 className="text-xl font-bold">المشاركة وإعادة الاستخدام</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          تحكم في كيفية مشاركة محتواك مع الآخرين
        </p>

        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">السماح بالمشاركة</p>
                <p className="text-sm text-muted-foreground">
                  السماح للآخرين بمشاركة منشوراتك
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allow_sharing}
              onCheckedChange={(v) => handleToggle('allow_sharing', v)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">السماح بالتنزيل</p>
                  <p className="text-sm text-muted-foreground">
                    السماح للآخرين بتنزيل صورك وفيديوهاتك
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allow_download}
                onCheckedChange={(v) => handleToggle('allow_download', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">إعادة مشاركة القصص</p>
                  <p className="text-sm text-muted-foreground">
                    السماح بإضافة قصصك إلى قصص الآخرين
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allow_reshare_stories}
                onCheckedChange={(v) => handleToggle('allow_reshare_stories', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">التضمين</p>
                  <p className="text-sm text-muted-foreground">
                    السماح بتضمين منشوراتك في مواقع أخرى
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allow_embed}
                onCheckedChange={(v) => handleToggle('allow_embed', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharingSettings;
