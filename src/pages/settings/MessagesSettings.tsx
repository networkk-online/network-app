import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MessagesSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    allow_messages_from_non_friends: true,
    allow_story_replies: true,
    message_requests: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('allow_messages_from_non_friends')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings(prev => ({
          ...prev,
          allow_messages_from_non_friends: data.allow_messages_from_non_friends ?? true,
        }));
      }

      // Load from localStorage for other settings
      const storyReplies = localStorage.getItem('allow_story_replies');
      const messageRequests = localStorage.getItem('message_requests');
      
      setSettings(prev => ({
        ...prev,
        allow_story_replies: storyReplies !== 'false',
        message_requests: messageRequests !== 'false',
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    if (key === 'allow_messages_from_non_friends') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
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

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          تحكم في من يمكنه إرسال الرسائل إليك والرد على قصصك
        </p>

        <div className="bg-card rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">الرسائل من غير المتابعين</p>
                <p className="text-sm text-muted-foreground">
                  السماح بتلقي رسائل من أشخاص لا تتابعهم
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allow_messages_from_non_friends}
              onCheckedChange={(v) => handleToggle('allow_messages_from_non_friends', v)}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">ردود القصص</p>
                  <p className="text-sm text-muted-foreground">
                    السماح للآخرين بالرد على قصصك
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allow_story_replies}
                onCheckedChange={(v) => handleToggle('allow_story_replies', v)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">طلبات الرسائل</p>
                  <p className="text-sm text-muted-foreground">
                    تلقي طلبات رسائل من حسابات جديدة
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.message_requests}
                onCheckedChange={(v) => handleToggle('message_requests', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesSettings;
