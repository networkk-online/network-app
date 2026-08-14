import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Loader2 } from 'lucide-react';

interface Props {
  onVerified: () => void;
}

/**
 * Mandatory TOTP step for super admins. Enrolls a factor the first time,
 * then challenges it on every new session.
 */
const AdminMfaChallenge = ({ onVerified }: Props) => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find(f => f.status === 'verified');
      if (verified) {
        setFactorId(verified.id);
      } else {
        const { data: enrolled, error: err } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `networkk-admin-${Date.now()}`,
        });
        if (err) setError(err.message);
        if (enrolled) {
          setFactorId(enrolled.id);
          setQr(enrolled.totp.qr_code);
          setSecret(enrolled.totp.secret);
        }
      }
      setLoading(false);
    })();
  }, []);

  const verify = async () => {
    if (code.trim().length < 6 || !factorId) return;
    setBusy(true);
    setError('');
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setError(cErr?.message || 'تعذر إنشاء طلب التحقق');
      setBusy(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError('رمز غير صحيح، حاول مرة أخرى');
      return;
    }
    onVerified();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#39FF14]">
          <KeyRound className="h-5 w-5" />
          <h1 className="font-semibold">تحقق ثنائي إلزامي</h1>
        </div>
        <p className="text-xs text-white/40">
          حساب المالك يتطلب رمز TOTP من تطبيق المصادقة للدخول إلى لوحة التحكم.
        </p>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#39FF14]" />
          </div>
        ) : (
          <>
            {qr && (
              <div className="space-y-2 text-center">
                <img src={qr} alt="رمز إعداد المصادقة الثنائية" className="mx-auto w-40 h-40 rounded-lg bg-white p-2" />
                <p className="text-[10px] text-white/30 break-all">المفتاح: {secret}</p>
              </div>
            )}
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className="text-center tracking-[0.5em] bg-white/[0.04] border-white/10 text-white"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button onClick={verify} disabled={busy || code.length < 6} className="w-full bg-[#39FF14] text-black hover:bg-[#39FF14]/90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الدخول'}
            </Button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.replace('/'); }}
              className="w-full text-xs text-white/30 hover:text-white/60"
            >
              تسجيل الخروج
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminMfaChallenge;
