import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Send, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface BroadcastRow {
  id: string;
  title: string;
  body: string;
  variant: string;
  created_at: string;
}

const VaultBroadcast = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('system_broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('vault_broadcast_history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_broadcasts' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('العنوان والمحتوى مطلوبان');
      return;
    }
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('system_broadcasts').insert({
      title: title.trim(),
      body: body.trim(),
      variant: 'info',
      created_by: user?.id,
    });
    setSending(false);
    if (error) {
      toast.error('فشل الإرسال: ' + error.message);
      return;
    }
    toast.success('📢 تم البث لجميع المستخدمين');
    setTitle('');
    setBody('');
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('system_broadcasts').delete().eq('id', id);
    if (error) toast.error('فشل الحذف');
  };

  return (
    <div className="p-6 space-y-6" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,102,0.15), rgba(0,255,102,0.04))',
            border: '1px solid rgba(0,255,102,0.35)',
            boxShadow: '0 0 24px rgba(0,255,102,0.25)',
          }}
        >
          <Megaphone className="w-6 h-6" style={{ color: '#00ff66' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">إشعار عام للجميع</h2>
          <p className="text-xs text-white/50">يصل فوراً لكل مستخدم متصل بالموقع</p>
        </div>
      </div>

      {/* Composer */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(8,12,18,0.95), rgba(2,6,10,0.98))',
          border: '1px solid rgba(0,255,102,0.18)',
          boxShadow: '0 0 30px rgba(0,255,102,0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div>
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2 block">العنوان</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تحديث جديد متوفر الآن"
            className="bg-black/50 border-white/10 text-white h-11 rounded-xl"
            maxLength={120}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2 block">المحتوى</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب رسالتك للمستخدمين..."
            className="bg-black/50 border-white/10 text-white rounded-xl min-h-[110px] resize-none"
            maxLength={500}
          />
          <p className="text-[10px] text-white/40 mt-1 text-left">{body.length}/500</p>
        </div>

        <Button
          onClick={send}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full h-12 rounded-xl font-bold text-base gap-2 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #00ff66, #00cc52)',
            color: '#001a08',
            boxShadow: '0 0 25px rgba(0,255,102,0.4)',
          }}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {sending ? 'جاري الإرسال...' : 'بث الإشعار للجميع'}
        </Button>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: '#00ff66' }} />
          <h3 className="text-sm font-bold text-white">آخر الإشعارات المُرسلة</h3>
        </div>
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="text-center py-10 text-white/40 text-sm">لا توجد إشعارات سابقة</div>
          )}
          {history.map((b) => (
            <div
              key={b.id}
              className="rounded-xl p-4 flex items-start justify-between gap-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm mb-1">{b.title}</p>
                <p className="text-xs text-white/60 line-clamp-2">{b.body}</p>
                <p className="text-[10px] text-white/30 mt-1.5" dir="ltr">
                  {new Date(b.created_at).toLocaleString('ar-IQ')}
                </p>
              </div>
              <button
                onClick={() => remove(b.id)}
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-red-500/15"
                style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)' }}
                aria-label="حذف"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultBroadcast;
