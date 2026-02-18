import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BadgeCheck, Check, X, Search } from 'lucide-react';

interface VerRequest {
  id: string;
  user_id: string;
  status: string;
  reason: string | null;
  rejection_reason: string | null;
  created_at: string;
  profile?: { username: string | null; full_name: string | null; phone_number: string | null };
}

const StealthVerification = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerRequest[]>([]);
  const [rejectionId, setRejectionId] = useState<string | null>(null);
  const [rejectionText, setRejectionText] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [manualUser, setManualUser] = useState<{ id: string; username: string | null; full_name: string | null; is_verified: boolean | null } | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const ids = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, phone_number').in('id', ids);
      setRequests(data.map(r => ({ ...r, profile: profiles?.find(p => p.id === r.user_id) })));
    } else {
      setRequests([]);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (req: VerRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('verification_requests').update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);

    await supabase.from('profiles').update({ is_verified: true }).eq('id', req.user_id);

    // Send notification
    if (user) {
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        actor_id: user.id,
        type: 'verification',
        content: 'تهانينا! تم توثيق حسابك في نيتورك بنجاح',
      });
    }

    toast({ title: 'Approved' });
    load();
  };

  const reject = async (id: string, userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('verification_requests').update({
      status: 'rejected',
      rejection_reason: rejectionText,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    if (user) {
      await supabase.from('notifications').insert({
        user_id: userId,
        actor_id: user.id,
        type: 'verification',
        content: `تم رفض طلب التوثيق: ${rejectionText}`,
      });
    }

    setRejectionId(null);
    setRejectionText('');
    toast({ title: 'Rejected' });
    load();
  };

  const searchManual = async () => {
    if (!manualSearch.trim()) return;
    const { data } = await supabase.from('profiles')
      .select('id, username, full_name, is_verified')
      .or(`username.ilike.%${manualSearch}%,full_name.ilike.%${manualSearch}%`)
      .limit(1)
      .maybeSingle();
    setManualUser(data);
    if (!data) toast({ title: 'User not found', variant: 'destructive' });
  };

  const toggleVerified = async () => {
    if (!manualUser) return;
    await supabase.from('profiles').update({ is_verified: !manualUser.is_verified }).eq('id', manualUser.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && !manualUser.is_verified) {
      await supabase.from('notifications').insert({
        user_id: manualUser.id,
        actor_id: user.id,
        type: 'verification',
        content: 'تهانينا! تم توثيق حسابك في نيتورك بنجاح',
      });
    }

    toast({ title: manualUser.is_verified ? 'Verification removed' : 'User verified' });
    setManualUser({ ...manualUser, is_verified: !manualUser.is_verified });
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return 'border-[#00ff41]/40 text-[#00ff41]';
    if (s === 'rejected') return 'border-red-500/40 text-red-400';
    return 'border-yellow-500/40 text-yellow-400';
  };

  return (
    <StealthLayout onRefresh={load}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">Verification & Badges</h1>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="bg-[#111] border border-[#1a1a1a]">
          <TabsTrigger value="requests" className="font-mono text-xs data-[state=active]:bg-[#00ff41]/10 data-[state=active]:text-[#00ff41]">Requests</TabsTrigger>
          <TabsTrigger value="manual" className="font-mono text-xs data-[state=active]:bg-[#00ff41]/10 data-[state=active]:text-[#00ff41]">Manual Verify</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card className="bg-[#111] border-[#1a1a1a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#00ff41]" /> Verification Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                    <TableHead className="font-mono text-xs text-gray-500">User</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Phone</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Reason</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Status</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500">Date</TableHead>
                    <TableHead className="font-mono text-xs text-gray-500 w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(r => (
                    <TableRow key={r.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                      <TableCell className="font-mono text-xs text-gray-300">
                        {r.profile?.full_name || r.profile?.username || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400" dir="ltr">{r.profile?.phone_number || '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-gray-400 max-w-[150px] truncate">{r.reason || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-500">{new Date(r.created_at || '').toLocaleDateString()}</TableCell>
                      <TableCell>
                        {r.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => approve(r)} className="text-gray-600 hover:text-[#00ff41] transition p-1" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            {rejectionId === r.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={rejectionText}
                                  onChange={e => setRejectionText(e.target.value)}
                                  placeholder="Reason"
                                  className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-[10px] h-7 w-24"
                                />
                                <button onClick={() => reject(r.id, r.user_id)} className="text-red-400 p-1"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setRejectionId(r.id)} className="text-gray-600 hover:text-red-400 transition p-1" title="Reject">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center font-mono text-xs text-gray-600 py-8">No requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card className="bg-[#111] border-[#1a1a1a]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider">Manual Verification Toggle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  placeholder="Search by username or name"
                  className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm flex-1"
                  dir="ltr"
                  onKeyDown={e => e.key === 'Enter' && searchManual()}
                />
                <Button onClick={searchManual} className="bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {manualUser && (
                <div className="p-4 bg-[#0a0a0a] rounded-md border border-[#1a1a1a] flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-200">{manualUser.full_name || manualUser.username}</p>
                    <p className="font-mono text-xs text-gray-500">@{manualUser.username}</p>
                  </div>
                  <Button
                    onClick={toggleVerified}
                    className={`font-mono text-xs uppercase ${manualUser.is_verified
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20'
                    }`}
                  >
                    {manualUser.is_verified ? 'Remove Badge' : 'Grant Badge'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StealthLayout>
  );
};

export default StealthVerification;
