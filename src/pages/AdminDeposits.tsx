import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Image, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import StealthLayout from '@/components/stealth/StealthLayout';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  receipt_url: string | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
  profile?: { username: string | null; full_name: string | null; avatar_url: string | null };
}

const AdminDeposits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadDeposits(); }, []);

  const loadDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    // Fetch profiles for each deposit
    const userIds = [...new Set((data || []).map(d => d.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    setDeposits((data || []).map(d => ({ ...d, profile: profileMap.get(d.user_id) || undefined })));
    setLoading(false);
  };

  const handleApprove = async (deposit: Deposit) => {
    setProcessing(deposit.id);
    // Update deposit status
    const { error: depError } = await supabase
      .from('deposits')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', deposit.id);

    if (depError) { toast({ title: 'خطأ', variant: 'destructive' }); setProcessing(null); return; }

    // Update user finances
    const { data: existing } = await supabase
      .from('user_finances')
      .select('balance, total_earnings')
      .eq('user_id', deposit.user_id)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_finances').update({
        balance: Number(existing.balance) + Number(deposit.amount),
        total_earnings: Number(existing.total_earnings) + Number(deposit.amount),
      }).eq('user_id', deposit.user_id);
    } else {
      await supabase.from('user_finances').insert({
        user_id: deposit.user_id,
        balance: deposit.amount,
        total_earnings: deposit.amount,
        total_withdrawn: 0,
      });
    }

    // Record transaction
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('transactions').insert({
      user_id: deposit.user_id,
      admin_id: user?.id || deposit.user_id,
      amount: deposit.amount,
      type: 'topup',
      status: 'completed',
      notes: 'إيداع يدوي - تمت الموافقة',
    });

    toast({ title: 'تمت الموافقة', description: `تم إضافة ${deposit.amount} للمستخدم` });
    setProcessing(null);
    loadDeposits();
  };

  const handleReject = async (depositId: string) => {
    if (!rejectReason.trim()) return;
    setProcessing(depositId);

    await supabase
      .from('deposits')
      .update({ status: 'rejected', reject_reason: rejectReason.trim(), reviewed_at: new Date().toISOString() })
      .eq('id', depositId);

    toast({ title: 'تم الرفض' });
    setRejectingId(null);
    setRejectReason('');
    setProcessing(null);
    loadDeposits();
  };

  const pending = deposits.filter(d => d.status === 'pending');
  const processed = deposits.filter(d => d.status !== 'pending');

  return (
    <StealthLayout onRefresh={loadDeposits}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono text-[#00ff41] tracking-wider uppercase">Deposits Management</h1>
          <span className="text-xs font-mono text-gray-500">{pending.length} pending</span>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-[#111] rounded-lg animate-pulse" />)}</div>
        ) : pending.length === 0 ? (
          <div className="text-center py-16 text-gray-600 font-mono text-sm">No pending deposits</div>
        ) : (
          <div className="space-y-3">
            {pending.map(dep => (
              <div key={dep.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {/* Receipt thumbnail */}
                  {dep.receipt_url && (
                    <button onClick={() => setLightboxUrl(dep.receipt_url)} className="shrink-0">
                      <img src={dep.receipt_url} alt="receipt" className="w-16 h-16 rounded-lg object-cover border border-[#222] hover:border-[#00ff41]/50 transition" />
                    </button>
                  )}
                  {!dep.receipt_url && (
                    <div className="w-16 h-16 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <Image className="w-5 h-5 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{dep.profile?.full_name || dep.profile?.username || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 font-mono">@{dep.profile?.username || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-[#00ff41] font-bold text-lg">{Number(dep.amount).toLocaleString()} IQD</span>
                      <span>{new Date(dep.created_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(dep)}
                      disabled={processing === dep.id}
                      className="bg-[#00ff41]/10 text-[#00ff41] hover:bg-[#00ff41]/20 border border-[#00ff41]/30 h-9"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingId(dep.id)}
                      disabled={processing === dep.id}
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10 h-9"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>

                {/* Reject reason input */}
                {rejectingId === dep.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 flex gap-2">
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="سبب الرفض..."
                      className="flex-1 bg-[#0a0a0a] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-red-500/60"
                    />
                    <Button size="sm" onClick={() => handleReject(dep.id)} disabled={!rejectReason.trim()} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                      تأكيد الرفض
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }} className="text-gray-500">
                      إلغاء
                    </Button>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Processed deposits */}
        {processed.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-mono text-gray-500 mb-3 uppercase tracking-wider">Processed</h2>
            <div className="space-y-2">
              {processed.slice(0, 20).map(dep => (
                <div key={dep.id} className="bg-[#0d0d0d] border border-[#151515] rounded-lg p-3 flex items-center gap-3 opacity-60">
                  <div className={`w-2 h-2 rounded-full ${dep.status === 'approved' ? 'bg-[#00ff41]' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-400 flex-1">{dep.profile?.username || 'Unknown'}</span>
                  <span className="text-sm font-mono text-gray-500">{Number(dep.amount).toLocaleString()}</span>
                  <span className={`text-xs font-mono ${dep.status === 'approved' ? 'text-[#00ff41]' : 'text-red-400'}`}>
                    {dep.status === 'approved' ? 'APPROVED' : 'REJECTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxUrl(null)} className="fixed inset-0 bg-black/90 z-[100]" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="fixed inset-4 z-[101] flex items-center justify-center">
              <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white z-10">
                <X className="w-6 h-6" />
              </button>
              <img src={lightboxUrl} alt="Receipt" className="max-w-full max-h-full object-contain rounded-xl" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </StealthLayout>
  );
};

export default AdminDeposits;
