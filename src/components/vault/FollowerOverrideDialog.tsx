import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2, RotateCcw, ShieldAlert } from 'lucide-react';
import { adminErrorMessage } from '@/lib/adminApi';

interface Props {
  open: boolean;
  user: { id: string; username?: string | null; full_name?: string | null } | null;
  onClose: () => void;
  onSaved?: () => void;
}

const PRESETS = [100, 1000, 10000, 100000, 1000000];

/**
 * Super-admin only: sets the *displayed* follower count for a profile.
 * No follow rows are created — the real count stays untouched.
 */
const FollowerOverrideDialog = ({ open, user, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [gateMessage, setGateMessage] = useState('');
  const [real, setReal] = useState(0);
  const [following, setFollowing] = useState(0);
  const [override, setOverride] = useState<number | null>(null);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | 'set' | 'clear'>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setReason('');
      setConfirm(null);
      try {
        const { data: { user: me } } = await supabase.auth.getUser();
        if (!me) throw new Error('unauthenticated');

        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', me.id);
        const isSuper = (roles || []).some(r => String(r.role) === 'super_admin');
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const hasAal2 = aal?.currentLevel === 'aal2';

        if (cancelled) return;
        if (!isSuper) {
          setAllowed(false);
          setGateMessage('هذا الإجراء متاح لمالك النظام (Super Admin) فقط.');
        } else if (!hasAal2) {
          setAllowed(false);
          setGateMessage('يجب تفعيل التحقق الثنائي (MFA) لهذه الجلسة قبل التعديل.');
        } else {
          setAllowed(true);
          setGateMessage('');
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('followers_count, following_count, follower_count_override')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        const p: any = prof || {};
        setReal(Number(p.followers_count || 0));
        setFollowing(Number(p.following_count || 0));
        const ov = p.follower_count_override === null || p.follower_count_override === undefined
          ? null
          : Number(p.follower_count_override);
        setOverride(ov);
        setValue(ov === null ? '' : String(ov));
      } catch (e: any) {
        if (!cancelled) {
          setAllowed(false);
          setGateMessage(adminErrorMessage(e.message));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  const apply = async (newCount: number | null) => {
    if (!user) return;
    if (reason.trim().length < 3) {
      toast({ title: '⚠️ يجب كتابة سبب واضح', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await (supabase as any).rpc('admin_set_follower_count_override', {
        target_user_id: user.id,
        new_count: newCount,
        reason: reason.trim(),
      });
      if (error) throw error;
      setOverride(newCount);
      setValue(newCount === null ? '' : String(newCount));
      toast({
        title: newCount === null ? '↩️ تم الإرجاع للعدد الحقيقي' : '✅ تم تحديث العدد الظاهر',
        description: 'تم تسجيل الإجراء في سجل التدقيق.',
      });
      setConfirm(null);
      setReason('');
      onSaved?.();
    } catch (e: any) {
      toast({ title: '❌ فشل التنفيذ', description: adminErrorMessage(e.message), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const parsed = Number(value);
  const validNumber = value.trim() !== '' && !Number.isNaN(parsed) && parsed >= 0;
  const shown = override ?? real;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-black/95 border border-[#39FF14]/20 backdrop-blur-xl text-white max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[#39FF14] flex items-center gap-2 text-base">
            <Users className="h-5 w-5" /> إدارة المتابعين
          </DialogTitle>
          <DialogDescription className="text-white/40 text-xs">
            @{user?.username || 'N/A'} — {user?.full_name || '—'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#39FF14]" /></div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-white/40">العدد الحقيقي</p>
                <p className="text-white text-lg font-bold">{real.toLocaleString('en-US')}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#39FF14]/[0.06] border border-[#39FF14]/20">
                <p className="text-white/40">العدد الظاهر</p>
                <p className="text-[#39FF14] text-lg font-bold">{shown.toLocaleString('en-US')}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-white/40">يتابع</p>
                <p className="text-white text-sm font-semibold">{following.toLocaleString('en-US')}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-white/40">الحالة</p>
                {override === null
                  ? <Badge className="bg-white/10 text-white/60 border border-white/10 text-[10px]">عدد حقيقي</Badge>
                  : <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px]">عدد مخصص</Badge>}
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-white/[0.02] border border-white/10">
                <p className="text-white/40">معرّف المستخدم</p>
                <p className="text-white/70 font-mono text-[10px] break-all" dir="ltr">{user?.id}</p>
              </div>
            </div>

            {!allowed ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                <ShieldAlert className="h-4 w-4 shrink-0" /> {gateMessage}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-white/50">عدد المتابعين الظاهر</p>
                  <Input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="اتركه فارغاً لاستخدام العدد الحقيقي"
                    className="bg-white/5 border-white/10 text-white"
                    dir="ltr"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setValue(String(p))}
                        className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-[11px] text-white/70 hover:bg-white/10"
                      >
                        {p.toLocaleString('en-US')}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="سبب الإجراء (إلزامي)"
                  className="bg-white/[0.04] border-white/10 text-white"
                />

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                  لا يتم إنشاء أي متابعات وهمية — يتم تغيير الرقم الظاهر فقط، ويُسجَّل الإجراء في سجل التدقيق.
                </div>

                {confirm && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-200">
                    سيتم تغيير عدد المتابعين الظاهر لهذا الحساب فقط.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} className="text-white/50">إغلاق</Button>
          {allowed && !loading && (
            <>
              <Button
                variant="ghost"
                disabled={busy || override === null}
                onClick={() => (confirm === 'clear' ? apply(null) : setConfirm('clear'))}
                className="text-white/70 border border-white/10"
              >
                <RotateCcw className="h-3.5 w-3.5 ml-1.5" />
                {confirm === 'clear' ? 'تأكيد الإرجاع' : 'إرجاع للعدد الحقيقي'}
              </Button>
              <Button
                disabled={busy || !validNumber}
                onClick={() => (confirm === 'set' ? apply(parsed) : setConfirm('set'))}
                className="bg-[#39FF14]/15 border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/25"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirm === 'set' ? 'تأكيد الحفظ' : 'حفظ'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowerOverrideDialog;
