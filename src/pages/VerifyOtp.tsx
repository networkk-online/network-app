import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Smartphone, Mail, ArrowRight, Loader2, ShieldCheck, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaskedEmail } from '@/components/MaskedEmail';
import networkLogo from '@/assets/network-logo.png';

type AuthMethod = 'phone' | 'email';
type Step = 'input' | 'verify';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const presetEmail = searchParams.get('email') || '';
  const flow = searchParams.get('flow') || ''; // 'login' = custom login OTP flow

  const isLoginFlow = flow === 'login';

  const [authMethod, setAuthMethod] = useState<AuthMethod>(presetEmail ? 'email' : 'phone');
  const [step, setStep] = useState<Step>(presetEmail ? 'verify' : 'input');
  const [identifier, setIdentifier] = useState(presetEmail);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(presetEmail ? 60 : 0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'verify') inputRefs.current[0]?.focus();
  }, [step]);

  const validateIdentifier = () => {
    if (authMethod === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
    }
    return /^\+?\d{8,15}$/.test(identifier.trim().replace(/\s/g, ''));
  };

  const sendCode = async () => {
    // Login-flow resends are not supported here (we don't have the password) → ask user to retry login
    if (isLoginFlow) {
      toast({
        title: 'يلزم إعادة تسجيل الدخول',
        description: 'لإرسال رمز جديد، يرجى العودة لصفحة تسجيل الدخول',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }
    if (!validateIdentifier()) {
      toast({
        title: 'إدخال غير صالح',
        description: authMethod === 'email' ? 'أدخل بريداً إلكترونياً صالحاً' : 'أدخل رقم هاتف صالحاً مع رمز الدولة',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const cleaned = identifier.trim().replace(/\s/g, '');
      const { error } =
        authMethod === 'email'
          ? await supabase.auth.signInWithOtp({ email: cleaned, options: { shouldCreateUser: false } })
          : await supabase.auth.signInWithOtp({ phone: cleaned.startsWith('+') ? cleaned : `+${cleaned}` });

      if (error) {
        toast({ title: 'تعذر إرسال الرمز', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'تم الإرسال', description: authMethod === 'email' ? 'تفقد بريدك' : 'تفقد رسائل الـ SMS' });
      setStep('verify');
      setResendCooldown(60);
      setOtp(Array(6).fill(''));
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message ?? 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast({ title: 'خطأ', description: 'أدخل رمز التحقق المكوّن من 6 أرقام', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const cleaned = identifier.trim().replace(/\s/g, '');

      // Both login & signup flows use Supabase's native OTP (sent via auth-email-hook
      // → custom dark/neon Network template). Verify with type 'email' / 'sms'.
      const params =
        authMethod === 'email'
          ? { email: cleaned, token: code, type: 'email' as const }
          : { phone: cleaned.startsWith('+') ? cleaned : `+${cleaned}`, token: code, type: 'sms' as const };

      const { data, error } = await supabase.auth.verifyOtp(params);
      if (error) {
        toast({ title: 'رمز غير صحيح', description: error.message, variant: 'destructive' });
        return;
      }
      if (data.session) {
        toast({ title: 'تم تسجيل الدخول ✅', description: 'مرحباً بك في نيتورك!' });
        navigate('/');
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message ?? 'حدث خطأ أثناء التحقق', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const code = otp.join('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div
        className="w-full max-w-md z-10 relative rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08]"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src={networkLogo} alt="Network" className="w-full h-full object-contain" />
          </div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-2 tracking-wide">تحقق من الهوية</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            لحماية حسابك، يرجى تأكيد رمز التحقق (OTP)
          </p>
        </div>

        {step === 'input' ? (
          <div className="space-y-5">
            {/* method toggle */}
            <div className="flex gap-2 p-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  authMethod === 'phone'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Smartphone size={16} /> رقم الهاتف
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                  authMethod === 'email'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mail size={16} /> البريد الإلكتروني
              </button>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-2">
                {authMethod === 'phone' ? 'رقم الهاتف المحمول' : 'عنوان البريد الإلكتروني'}
              </label>
              <input
                type={authMethod === 'phone' ? 'tel' : 'email'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={authMethod === 'phone' ? '+9647xxxxxxxx' : 'name@networkk.online'}
                dir="ltr"
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-left focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
              />
            </div>

            <button
              onClick={sendCode}
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={16} />}
              إرسال رمز التحقق
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-zinc-400 text-sm">
              تم إرسال الرمز إلى{' '}
              {authMethod === 'email' ? (
                <MaskedEmail email={identifier} className="font-bold text-base" />
              ) : (
                <span className="text-emerald-400 font-medium" dir="ltr">{identifier}</span>
              )}
            </p>

            <div className="flex justify-center gap-2.5" dir="ltr" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={(e) => e.target.select()}
                  disabled={isLoading}
                  className={`w-12 h-14 bg-zinc-950 border ${
                    digit ? 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : 'border-zinc-800'
                  } text-white rounded-xl text-center text-xl font-bold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all`}
                />
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={verifyCode}
                disabled={isLoading || code.length !== 6}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                تأكيد الرمز
              </button>

              <button
                onClick={() => { setStep('input'); setOtp(Array(6).fill('')); }}
                className="w-full bg-transparent text-zinc-400 hover:text-white py-2 text-sm transition-all"
              >
                تغيير {authMethod === 'phone' ? 'الرقم' : 'البريد'}
              </button>

              <button
                onClick={sendCode}
                disabled={resendCooldown > 0 || isLoading}
                className={`w-full flex items-center justify-center gap-1.5 text-sm py-2 transition-colors ${
                  resendCooldown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-emerald-400/70 hover:text-emerald-400'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown}s` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
