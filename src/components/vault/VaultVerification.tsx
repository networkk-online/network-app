import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, CheckCircle2, XCircle, Eye, User, Calendar, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profile?: { username: string; full_name: string; avatar_url: string | null };
}

const VaultVerification = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadRequests(); }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    let query = supabase.from('verification_requests').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setRequests(data.map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
    }
    setLoading(false);
  };

  const approveUser = async (req: VerificationRequest) => {
    await supabase.from('profiles').update({ is_verified: true, verification_type: 'blue' }).eq('id', req.user_id);
    await supabase.from('verification_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', req.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('security_logs').insert({
      user_id: user?.id, action_type: 'verification_approved', attempted_route: `/verify/${req.user_id}`,
      ip_address: 'dashboard', details: { target_user: req.user_id, username: req.profile?.username },
    });
    toast({ title: '✅ تم توثيق الحساب', description: `@${req.profile?.username}` });
    loadRequests();
  };

  const rejectUser = async () => {
    if (!selectedUser) return;
    await supabase.from('verification_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reject_reason: rejectReason }).eq('id', selectedUser.id);
    await supabase.from('notifications').insert({
      user_id: selectedUser.user_id, actor_id: selectedUser.user_id, type: 'verification_rejected',
      content: `تم رفض طلب التوثيق: ${rejectReason}`,
    });
    toast({ title: '❌ تم رفض الطلب' });
    setShowRejectDialog(false);
    setRejectReason('');
    setSelectedUser(null);
    loadRequests();
  };

  const manualVerify = async (userId: string, verified: boolean) => {
    await supabase.from('profiles').update({
      is_verified: verified,
      verification_type: verified ? 'blue' : null,
    }).eq('id', userId);
    toast({ title: verified ? '✅ تم منح التوثيق يدوياً' : '🚫 تم إلغاء التوثيق' });
    loadRequests();
  };

  const filtered = searchQuery.trim()
    ? requests.filter(r => r.profile?.username?.includes(searchQuery) || r.profile?.full_name?.includes(searchQuery))
    : requests;

  const counts = { pending: requests.filter(r => r.status === 'pending').length };

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 bg-white/[0.04]" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'في الانتظار', count: counts.pending, color: '#FFD700' },
          { label: 'موافق عليها', count: requests.filter(r => r.status === 'approved').length, color: '#39FF14' },
          { label: 'مرفوضة', count: requests.filter(r => r.status === 'rejected').length, color: '#FF4444' },
        ].map(s => (
          <Card key={s.label} className="bg-white/[0.03] border-white/[0.08]">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.count}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs transition-all ${filter === f ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30' : 'bg-white/[0.04] text-white/30 hover:text-white/60'}`}>
            {f === 'pending' ? 'معلّق' : f === 'approved' ? 'مقبول' : f === 'rejected' ? 'مرفوض' : 'الكل'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو المعرف..."
          className="w-full h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#39FF14]/30" />
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardContent className="py-12 text-center text-white/30 text-sm">لا توجد طلبات</CardContent>
          </Card>
        ) : filtered.map(req => (
          <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden">
                {req.profile?.avatar_url ? <img src={req.profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-white/20" />}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{req.profile?.full_name || 'مجهول'}</p>
                <p className="text-[11px] text-white/30">@{req.profile?.username} • <Calendar className="inline w-3 h-3" /> {new Date(req.created_at).toLocaleDateString('ar-IQ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={
                req.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' :
                req.status === 'approved' ? 'bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/20' :
                'bg-red-500/15 text-red-400 border-red-500/20'
              }>
                {req.status === 'pending' ? 'معلّق' : req.status === 'approved' ? 'موافق' : 'مرفوض'}
              </Badge>
              {req.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => approveUser(req)}
                    className="bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30 hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all h-8 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> توثيق
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(req); setShowRejectDialog(true); }}
                    className="text-red-400 hover:bg-red-500/10 h-8 text-xs">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> رفض
                  </Button>
                </>
              )}
              {req.status === 'approved' && (
                <Button size="sm" variant="ghost" onClick={() => manualVerify(req.user_id, false)}
                  className="text-red-400/60 hover:bg-red-500/10 h-8 text-[10px]">إلغاء التوثيق</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-black/95 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-red-400">سبب الرفض</DialogTitle></DialogHeader>
          <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="صورة غير واضحة، بيانات غير متطابقة..."
            className="bg-white/[0.04] border-white/10 text-white min-h-[100px]" />
          <Button onClick={rejectUser} disabled={!rejectReason.trim()} className="bg-red-500 hover:bg-red-600 text-white">إرسال الرفض</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultVerification;
