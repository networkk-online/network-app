import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AtSign, Users, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const TagsMentions = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    allow_tags_from: 'everyone', // everyone, following, none
    allow_mentions_from: 'everyone',
    manual_tag_approval: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const saved = localStorage.getItem('tags_mentions_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('tags_mentions_settings', JSON.stringify(updated));
    toast({ title: "تم حفظ الإعداد" });
  };

  const OptionButton = ({ value, current, label, onClick }: { value: string; current: string; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
        current === value
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );

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
          <h1 className="text-xl font-bold">الوسوم والإشارات</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Tags Settings */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <AtSign className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">من يمكنه الإشارة إليك</p>
              <p className="text-sm text-muted-foreground">
                تحكم في من يمكنه وضع إشارة لك في المنشورات
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              value="everyone"
              current={settings.allow_tags_from}
              label="الجميع"
              onClick={() => handleChange('allow_tags_from', 'everyone')}
            />
            <OptionButton
              value="following"
              current={settings.allow_tags_from}
              label="من أتابعهم فقط"
              onClick={() => handleChange('allow_tags_from', 'following')}
            />
            <OptionButton
              value="none"
              current={settings.allow_tags_from}
              label="لا أحد"
              onClick={() => handleChange('allow_tags_from', 'none')}
            />
          </div>
        </div>

        {/* Mentions Settings */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">من يمكنه ذكرك</p>
              <p className="text-sm text-muted-foreground">
                تحكم في من يمكنه ذكرك (@) في التعليقات
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              value="everyone"
              current={settings.allow_mentions_from}
              label="الجميع"
              onClick={() => handleChange('allow_mentions_from', 'everyone')}
            />
            <OptionButton
              value="following"
              current={settings.allow_mentions_from}
              label="من أتابعهم فقط"
              onClick={() => handleChange('allow_mentions_from', 'following')}
            />
            <OptionButton
              value="none"
              current={settings.allow_mentions_from}
              label="لا أحد"
              onClick={() => handleChange('allow_mentions_from', 'none')}
            />
          </div>
        </div>

        {/* Manual Approval */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">الموافقة اليدوية على الوسوم</p>
                <p className="text-sm text-muted-foreground">
                  مراجعة الوسوم قبل ظهورها في ملفك الشخصي
                </p>
              </div>
            </div>
            <Switch
              checked={settings.manual_tag_approval}
              onCheckedChange={(v) => handleChange('manual_tag_approval', v)}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground px-2">
          عند تفعيل الموافقة اليدوية، ستحتاج للموافقة على كل وسم قبل ظهوره في ملفك الشخصي.
        </p>
      </div>
    </div>
  );
};

export default TagsMentions;
