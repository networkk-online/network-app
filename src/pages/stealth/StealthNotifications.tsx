import { useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Loader2 } from 'lucide-react';

const StealthNotifications = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<{ title: string; message: string; time: string; count: number }[]>([]);

  const sendToAll = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all user IDs
      const { data: profiles } = await supabase.from('profiles').select('id');
      if (!profiles || profiles.length === 0) {
        toast({ title: 'No users found', variant: 'destructive' });
        return;
      }

      // Insert notifications for all users
      const notifications = profiles.map(p => ({
        user_id: p.id,
        actor_id: user.id,
        type: 'system',
        content: JSON.stringify({ title, message }),
      }));

      // Batch insert in chunks of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const chunk = notifications.slice(i, i + 100);
        await supabase.from('notifications').insert(chunk);
      }

      setHistory(prev => [{ title, message, time: new Date().toLocaleTimeString(), count: profiles.length }, ...prev]);
      toast({ title: `Sent to ${profiles.length} users` });
      setTitle('');
      setMessage('');
    } catch (err) {
      toast({ title: 'Failed to send', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <StealthLayout>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">Notification Center</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Send className="h-4 w-4 text-[#00ff41]" /> Broadcast Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notification title"
                className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 block">Message</label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm min-h-[120px]"
              />
            </div>
            <Button
              onClick={sendToAll}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 font-mono text-xs uppercase"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Send to All Users
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider">Send History (Session)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center font-mono text-xs text-gray-600 py-8">No broadcasts sent this session</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="p-3 bg-[#0a0a0a] rounded-md border border-[#1a1a1a]">
                    <div className="flex justify-between items-start">
                      <p className="font-mono text-xs text-[#00ff41]">{h.title}</p>
                      <span className="font-mono text-[10px] text-gray-600">{h.time}</span>
                    </div>
                    <p className="font-mono text-xs text-gray-400 mt-1">{h.message}</p>
                    <p className="font-mono text-[10px] text-gray-600 mt-1">→ {h.count} recipients</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </StealthLayout>
  );
};

export default StealthNotifications;
