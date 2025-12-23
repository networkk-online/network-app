import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Share2, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ReelsSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    comments_enabled: true,
    likes_enabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('comments_enabled, likes_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          comments_enabled: data.comments_enabled ?? true,
          likes_enabled: data.likes_enabled ?? true
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          comments_enabled: settings.comments_enabled,
          likes_enabled: settings.likes_enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الريلز بنجاح'
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء الحفظ',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
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
      <div className="sticky top-0 bg-background border-b border-border z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">إعدادات الريلز</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              التعليقات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>السماح بالتعليقات</Label>
                <p className="text-sm text-muted-foreground">
                  السماح للآخرين بالتعليق على الريلز الخاصة بك
                </p>
              </div>
              <Switch
                checked={settings.comments_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, comments_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-5 h-5" />
              الإعجابات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>إظهار عدد الإعجابات</Label>
                <p className="text-sm text-muted-foreground">
                  السماح للآخرين برؤية عدد الإعجابات على الريلز
                </p>
              </div>
              <Switch
                checked={settings.likes_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, likes_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-5 h-5" />
              التشغيل التلقائي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              الريلز تُشغل تلقائياً عند التمرير للحصول على أفضل تجربة
            </p>
          </CardContent>
        </Card>

        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
};

export default ReelsSettings;
