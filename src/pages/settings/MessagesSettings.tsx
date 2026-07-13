import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type SettingsShape = {
  allow_messages_from_non_friends: boolean;
  allow_story_replies: boolean;
  allow_message_requests: boolean;
};

const DEFAULTS: SettingsShape = {
  allow_messages_from_non_friends: true,
  allow_story_replies: true,
  allow_message_requests: true,
};

const MessagesSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof SettingsShape | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_settings')
          .select('allow_messages_from_non_friends, allow_story_replies, allow_message_requests')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Load settings error:', error);
        }

        setSettings({
          allow_messages_from_non_friends: data?.allow_messages_from_non_friends ?? true,
          allow_story_replies: (data as any)?.allow_story_replies ?? true,
          allow_message_requests: (data as any)?.allow_message_requests ?? true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleToggle = async (key: keyof SettingsShape, value: boolean) => {
    if (!userId) return;
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, [key]: value } as any,
        { onConflict: 'user_id' }
      );

    setSavingKey(null);

    if (error) {
      console.error(`Failed to save ${key}:`, error);
      // revert
      setSettings((prev) => ({ ...prev, [key]: previous }));
      toast({
        title: 'تعذر حفظ الإعداد',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'تم حفظ الإعداد' });
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
          <h1 className="text-xl font-bold">الرسائل وردود القصص</h1>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          تحكم في من يمكنه إرسال الرسائل إليك والرد على قصصك
        </p>

        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">الرسائل من غير المتابعين</p>
                <p className="text-sm text-muted-foreground">السماح بتلقي رسائل من أشخاص لا تتابعهم</p>
              </div>
            </div>
            <Switch
              checked={settings.allow_messages_from_non_friends}
              disabled={savingKey === 'allow_messages_from_non_friends'}
              onCheckedChange={(v) => handleToggle('allow_messages_from_non_friends', v)}
            />
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">ردود القصص</p>
                <p className="text-sm text-muted-foreground">السماح للآخرين بالرد على قصصك</p>
              </div>
            </div>
            <Switch
              checked={settings.allow_story_replies}
              disabled={savingKey === 'allow_story_replies'}
              onCheckedChange={(v) => handleToggle('allow_story_replies', v)}
            />
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">طلبات الرسائل</p>
                <p className="text-sm text-muted-foreground">تلقي طلبات رسائل من حسابات جديدة</p>
              </div>
            </div>
            <Switch
              checked={settings.allow_message_requests}
              disabled={savingKey === 'allow_message_requests'}
              onCheckedChange={(v) => handleToggle('allow_message_requests', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesSettings;
