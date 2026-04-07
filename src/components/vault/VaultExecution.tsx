import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Bell, Trash2, RefreshCw, Shield, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VaultExecution = () => {
  const { toast } = useToast();
  const [notifMessage, setNotifMessage] = useState('');
  const [sending, setSending] = useState(false);

  const actions = [
    {
      label: 'إرسال إشعار عام',
      desc: 'إرسال إشعار لجميع المستخدمين',
      icon: Bell,
      color: '#FFD700',
      custom: true,
    },
    {
      label: 'تفعيل وضع الصيانة',
      desc: 'إيقاف التطبيق مؤقتاً لجميع المستخدمين',
      icon: Shield,
      color: '#FF4444',
      action: async () => {
        await supabase.from('app_settings').upsert({ key: 'maintenance_mode', value: { enabled: true, message: 'التطبيق تحت الصيانة' }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        toast({ title: '🔴 تم تفعيل وضع الصيانة' });
      },
    },
    {
      label: 'إيقاف وضع الصيانة',
      desc: 'إعادة التطبيق للعمل الطبيعي',
      icon: RefreshCw,
      color: '#39FF14',
      action: async () => {
        await supabase.from('app_settings').upsert({ key: 'maintenance_mode', value: { enabled: false }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        toast({ title: '🟢 التطبيق متاح الآن' });
      },
    },
    {
      label: 'مسح الإشعارات القديمة',
      desc: 'حذف الإشعارات الأقدم من 30 يوم',
      icon: Trash2,
      color: '#A855F7',
      action: async () => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('notifications').delete().lt('created_at', thirtyDaysAgo);
        toast({ title: '🧹 تم مسح الإشعارات القديمة' });
      },
    },
  ];

  const sendGlobalNotification = async () => {
    if (!notifMessage.trim()) return;
    setSending(true);
    const { data: users } = await supabase.from('profiles').select('id').limit(1000);
    if (users) {
      const { data: { user } } = await supabase.auth.getUser();
      const batch = users.map(u => ({
        user_id: u.id, actor_id: user?.id || u.id, type: 'system', content: notifMessage,
      }));
      const chunkSize = 100;
      for (let i = 0; i < batch.length; i += chunkSize) {
        await supabase.from('notifications').insert(batch.slice(i, i + chunkSize));
      }
      toast({ title: `📢 تم الإرسال لـ ${users.length} مستخدم` });
    }
    setNotifMessage('');
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.filter(a => !a.custom).map(a => (
          <Card key={a.label} className="bg-white/[0.03] border-white/[0.06] group hover:border-white/[0.12] transition-all cursor-pointer" onClick={a.action}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${a.color}15` }}>
                <a.icon className="w-6 h-6" style={{ color: a.color }} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{a.label}</p>
                <p className="text-[11px] text-white/25 mt-0.5">{a.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Notification */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#FFD700] text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> إشعار عام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="اكتب رسالة الإشعار..."
            className="bg-white/[0.04] border-white/[0.08] text-white min-h-[80px]" />
          <Button onClick={sendGlobalNotification} disabled={sending || !notifMessage.trim()}
            className="bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 w-full">
            <Send className="w-4 h-4 mr-2" />{sending ? 'جاري الإرسال...' : 'إرسال لجميع المستخدمين'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaultExecution;
