import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Ask for the admin password again before running the action. */
  requireReauth?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

/**
 * Confirmation dialog for destructive/privileged admin actions.
 * Always requires a written reason (stored in the audit log) and can
 * additionally require re-authentication for high-risk operations.
 */
const ReasonDialog = ({ open, title, description, requireReauth, confirmLabel = 'تنفيذ', onCancel, onConfirm }: Props) => {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    if (reason.trim().length < 3) { setError('يجب كتابة سبب واضح'); return; }
    setBusy(true);
    try {
      if (requireReauth) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) { setError('تعذر التحقق من الهوية'); setBusy(false); return; }
        const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
        if (authErr) { setError('كلمة المرور غير صحيحة'); setBusy(false); return; }
      }
      await onConfirm(reason.trim());
      setReason(''); setPassword('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="h-4 w-4 text-red-400" /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {description && <p className="text-xs text-white/40">{description}</p>}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
            سيتم تسجيل هذا الإجراء نهائياً في سجل التدقيق مع هويتك والوقت والسبب.
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الإجراء (إلزامي)"
            className="bg-white/[0.04] border-white/10 text-white"
          />
          {requireReauth && (
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور للتأكيد"
              className="bg-white/[0.04] border-white/10 text-white"
            />
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel} className="text-white/50">إلغاء</Button>
          <Button onClick={run} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white">
            {busy ? '...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReasonDialog;
