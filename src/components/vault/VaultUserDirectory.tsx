import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Ban, Trash2, Bell, Users, ChevronLeft, ChevronRight, ShieldCheck, Eye, EyeOff, Loader2, BadgeCheck, Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type BadgeType = 'blue' | 'gold' | 'gray' | 'none';

const BADGE_META: Record<Exclude<BadgeType, 'none'>, { color: string; label: string; glow?: string }> = {
  blue: { color: '#3B82F6', label: 'Verified' },
  gold: { color: '#FFD700', label: 'VIP / Partner', glow: '0 0 12px rgba(255,215,0,0.55)' },
  gray: { color: '#9CA3AF', label: 'Official' },
};

// Map admin badges -> existing verification_type values used elsewhere in the app
const toVerificationType = (b: BadgeType): string | null => {
  if (b === 'blue') return 'notable';
  if (b === 'gold') return 'business';
  if (b === 'gray') return 'government';
  return null;
};
const fromVerificationType = (v: string | null): BadgeType => {
  if (v === 'notable') return 'blue';
  if (v === 'business') return 'gold';
  if (v === 'government') return 'gray';
  return 'none';
};

const VaultUserDirectory = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const [resetModal, setResetModal] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Notify modal
  const [notifyModal, setNotifyModal] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [notifyText, setNotifyText] = useState('');
  const [sending, setSending] = useState(false);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: any | null; step: 1 | 2 }>({ open: false, user: null, step: 1 });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    if (search.trim()) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }
    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setUsers(data || []);
    setTotal(count || 0);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const updateBadge = async (userId: string, badge: BadgeType) => {
    const vType = toVerificationType(badge);
    const { error } = await supabase.from('profiles').update({
      is_verified: badge !== 'none',
      verification_type: vType,
    }).eq('id', userId);
    if (error) {
      toast({ title: '❌ فشل التحديث', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ تم تحديث الشارة', description: badge === 'none' ? 'تمت الإزالة' : BADGE_META[badge].label });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verification_type: vType, is_verified: badge !== 'none' } : u));
  };

  const toggleBan = async (u: any) => {
    const next = !u.is_banned;
    const { error } = await supabase.from('profiles').update({ is_banned: next } as any).eq('id', u.id);
    if (error) {
      toast({ title: '❌ فشل', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: next ? '🔒 تم حظر الحساب' : '🔓 تم رفع الحظر' });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_banned: next } : x));
  };

  const sendNotification = async () => {
    if (!notifyModal.user || !notifyText.trim()) return;
    setSending(true);
    try {
      const { data: { user: me } } = await supabase.auth.getUser();
      if (!me) throw new Error('Not authenticated');
      const { error } = await supabase.from('notifications').insert({
        user_id: notifyModal.user.id,
        actor_id: me.id,
        type: 'system',
        content: notifyText.trim(),
      });
      if (error) throw error;
      toast({ title: '✅ تم إرسال الإشعار' });
      setNotifyModal({ open: false, user: null });
      setNotifyText('');
    } catch (e: any) {
      toast({ title: '❌ فشل الإرسال', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.user) return;
    setDeleting(true);
    try {
      const res = await supabase.functions.invoke('admin-delete-user', { body: { userId: deleteModal.user.id } });
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.ok) throw new Error(res.data?.error || 'Failed');
      toast({ title: '🗑️ تم حذف الحساب نهائياً' });
      setDeleteModal({ open: false, user: null, step: 1 });
      fetchUsers();
    } catch (e: any) {
      toast({ title: '❌ فشل الحذف', description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetModal.user || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: '⚠️ 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setResetting(true);
    try {
      const res = await supabase.functions.invoke('admin-update-password', {
        body: { userId: resetModal.user.id, password: newPassword },
      });
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.ok) throw new Error(res.data?.error || 'Failed');
      toast({ title: '✅ تم تحديث كلمة المرور' });
      setResetModal({ open: false, user: null });
      setNewPassword('');
    } catch (e: any) {
      toast({ title: '❌ فشل', description: e.message, variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const renderBadgePreview = (badge: BadgeType) => {
    if (badge === 'none') return <span className="text-gray-600 text-xs">—</span>;
    const meta = BADGE_META[badge];
    return (
      <BadgeCheck
        className="h-4 w-4"
        style={{ color: meta.color, filter: badge === 'gold' ? `drop-shadow(${meta.glow})` : undefined }}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="بحث بالاسم، المستخدم، أو الهاتف..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-white/5 border-white/10 text-white pr-10"
          />
        </div>
        <Badge variant="outline" className="text-[#39FF14] border-[#39FF14]/30 shrink-0">
          <Users className="h-3 w-3 mr-1" /> {total}
        </Badge>
      </div>

      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-right text-gray-400">المستخدم</TableHead>
                <TableHead className="text-right text-gray-400 hidden md:table-cell">الهاتف</TableHead>
                <TableHead className="text-right text-gray-400">الشارة</TableHead>
                <TableHead className="text-right text-gray-400">الحالة</TableHead>
                <TableHead className="text-right text-gray-400">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const currentBadge = fromVerificationType(u.verification_type);
                return (
                  <TableRow key={u.id} className={cn('border-white/5 hover:bg-white/[0.02]', u.is_banned && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#39FF14]">
                          {(u.full_name || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium flex items-center gap-1.5">
                            {u.full_name || '-'}
                            {renderBadgePreview(currentBadge)}
                          </p>
                          <p className="text-xs text-gray-500">@{u.username || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm font-mono hidden md:table-cell">
                      {u.phone_number || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={currentBadge}
                        onValueChange={(val) => updateBadge(u.id, val as BadgeType)}
                      >
                        <SelectTrigger
                          className="bg-white/5 border-white/10 text-white h-8 w-32 text-xs"
                          style={currentBadge === 'gold' ? { boxShadow: BADGE_META.gold.glow, borderColor: 'rgba(255,215,0,0.4)' } : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          <SelectItem value="none">— بدون</SelectItem>
                          <SelectItem value="blue"><span style={{ color: BADGE_META.blue.color }}>● Blue · Verified</span></SelectItem>
                          <SelectItem value="gold"><span style={{ color: BADGE_META.gold.color, textShadow: BADGE_META.gold.glow }}>● Gold · VIP</span></SelectItem>
                          <SelectItem value="gray"><span style={{ color: BADGE_META.gray.color }}>● Gray · Official</span></SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {u.is_banned ? (
                        <Badge className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">محظور</Badge>
                      ) : (
                        <Badge className="bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 text-[10px]">نشط</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className={cn('h-7 w-7', u.is_banned ? 'text-red-400 hover:text-red-300' : 'text-gray-500 hover:text-red-400')}
                          title={u.is_banned ? 'رفع الحظر' : 'حظر / تعليق'}
                          onClick={() => toggleBan(u)}
                        >
                          {u.is_banned ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-cyan-400"
                          title="إرسال إشعار"
                          onClick={() => { setNotifyModal({ open: true, user: u }); setNotifyText(''); }}
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-[#39FF14]/60 hover:text-[#39FF14] hover:bg-[#39FF14]/10"
                          title="إعادة ضبط الرمز"
                          onClick={() => { setResetModal({ open: true, user: u }); setNewPassword(''); setShowPassword(false); }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-red-500"
                          title="حذف الحساب"
                          onClick={() => setDeleteModal({ open: true, user: u, step: 1 })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">لا يوجد مستخدمون</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} من {total}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} className="text-gray-400">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Password Reset */}
      <Dialog open={resetModal.open} onOpenChange={(open) => { if (!open) setResetModal({ open: false, user: null }); }}>
        <DialogContent className="bg-black/95 border border-[#39FF14]/20 backdrop-blur-xl text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#39FF14] flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5" /> إعادة ضبط كلمة المرور
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs">
              @{resetModal.user?.username || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="كلمة المرور الجديدة (6+)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-[#39FF14]/20 text-white pr-3 pl-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button onClick={handlePasswordReset} disabled={resetting || newPassword.length < 6}
              className="w-full bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/20">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              تأكيد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notify */}
      <Dialog open={notifyModal.open} onOpenChange={(open) => { if (!open) setNotifyModal({ open: false, user: null }); }}>
        <DialogContent className="bg-black/95 border border-cyan-400/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" /> إشعار مباشر
            </DialogTitle>
            <DialogDescription className="text-white/40 text-xs">
              إلى @{notifyModal.user?.username || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea
              placeholder="نص الإشعار..."
              value={notifyText}
              onChange={(e) => setNotifyText(e.target.value)}
              rows={4}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button onClick={sendNotification} disabled={sending || !notifyText.trim()}
              className="w-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              إرسال
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete (double confirm) */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => { if (!open) setDeleteModal({ open: false, user: null, step: 1 }); }}>
        <DialogContent className="bg-black/95 border border-red-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5" /> حذف الحساب نهائياً
            </DialogTitle>
            <DialogDescription className="text-white/50 text-xs">
              @{deleteModal.user?.username || 'N/A'} — هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-sm">
            {deleteModal.step === 1 ? (
              <>
                <p className="text-white/70">سيتم حذف الحساب وجميع بياناته. هل أنت متأكد؟</p>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setDeleteModal({ open: false, user: null, step: 1 })}>إلغاء</Button>
                  <Button className="bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                    onClick={() => setDeleteModal(s => ({ ...s, step: 2 }))}>متابعة</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <p className="text-red-300 font-bold">⚠️ تأكيد نهائي — هل تؤكد الحذف؟</p>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setDeleteModal({ open: false, user: null, step: 1 })}>تراجع</Button>
                  <Button disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    حذف نهائي
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaultUserDirectory;
