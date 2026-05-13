import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Users, Skull, Loader2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Stream {
  id: string;
  host_id: string;
  channel_name: string;
  title: string | null;
  status: string;
  viewer_count: number;
  started_at: string;
}

interface GiftRow {
  id: string;
  creator_id: string;
  sender_id: string;
  gift_name: string | null;
  total_price: number;
  creator_earning: number;
  created_at: string;
}

export const VaultLiveMonitor = () => {
  const { toast } = useToast();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState<string | null>(null);

  const load = async () => {
    const [{ data: s }, { data: g }] = await Promise.all([
      supabase.from('live_streams').select('*').eq('status', 'live').order('started_at', { ascending: false }),
      supabase.from('gift_ledger').select('id,creator_id,sender_id,gift_name,total_price,creator_earning,created_at')
        .order('created_at', { ascending: false }).limit(50),
    ]);
    setStreams((s as Stream[]) || []);
    setGifts((g as GiftRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('vault-live-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gift_ledger' }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  const killStream = async (id: string) => {
    if (!confirm('تأكيد إيقاف هذا البث؟')) return;
    setKilling(id);
    const { error } = await supabase.functions.invoke('admin-kill-stream', {
      body: { stream_id: id, reason: 'انتهاك بروتوكول الأمان' },
    });
    setKilling(null);
    if (error) {
      toast({ title: 'فشل الإيقاف', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🛑 تم إيقاف البث' });
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#39FF14] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-white font-bold text-lg">البثوث النشطة ({streams.length})</h3>
        </div>

        {streams.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center text-white/40 text-sm">
            لا توجد بثوث نشطة حالياً
          </div>
        ) : (
          <div className="grid gap-3">
            {streams.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.04] backdrop-blur-xl border border-[#39FF14]/20 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#39FF14]/15 border border-[#39FF14]/40 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-[#39FF14]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{s.title || 'بث بدون عنوان'}</p>
                  <p className="text-white/40 text-xs font-mono truncate">{s.channel_name}</p>
                </div>
                <div className="flex items-center gap-1 text-white/70 text-sm">
                  <Eye className="w-4 h-4" /> {s.viewer_count}
                </div>
                <button
                  disabled={killing === s.id}
                  onClick={() => killStream(s.id)}
                  className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {killing === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Skull className="w-3.5 h-3.5" />}
                  إيقاف
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-white font-bold text-lg mb-4">آخر 50 هدية</h3>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-white/50 text-xs">
              <tr>
                <th className="text-right p-3">الهدية</th>
                <th className="text-right p-3">السعر</th>
                <th className="text-right p-3">للمبدع</th>
                <th className="text-right p-3">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((g) => (
                <tr key={g.id} className="border-t border-white/5 text-white/80">
                  <td className="p-3">{g.gift_name || '-'}</td>
                  <td className="p-3">{Number(g.total_price).toFixed(2)}</td>
                  <td className="p-3 text-[#39FF14]">{Number(g.creator_earning).toFixed(2)}</td>
                  <td className="p-3 text-xs text-white/40">{new Date(g.created_at).toLocaleString('ar')}</td>
                </tr>
              ))}
              {gifts.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-white/40">لا توجد هدايا بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
