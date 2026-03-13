import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, RotateCw } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const VerifyOtp = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { toast } = useToast();

  useEffect(() => {
    if (!email) {
      navigate('/signup');
      return;
    }
    // Start cooldown on mount
    setResendCooldown(60);
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast({ title: 'خطأ', description: 'أدخل رمز التحقق المكوّن من 6 أرقام', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });
      if (error) {
        toast({ title: 'رمز غير صحيح', description: error.message === 'Token has expired or is invalid' ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : error.message, variant: 'destructive' });
        return;
      }
      if (data.session) {
        toast({ title: 'تم التحقق بنجاح ✅', description: 'مرحباً بك في نيتورك!' });
        navigate('/');
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء التحقق', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'تم إعادة الإرسال', description: 'تفقد بريدك الإلكتروني' });
      setResendCooldown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      toast({ title: 'خطأ', description: 'تعذر إعادة إرسال الرمز', variant: 'destructive' });
    }
  };

  const code = otp.join('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="w-full max-w-md z-10 relative rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08]"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}
      >
        {/* Logo & Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src={networkLogo} alt="Network Logo" className="w-full h-full object-contain" />
          </div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-2 tracking-wide">التحقق من البريد</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            تم إرسال رمز مكوّن من 6 أرقام إلى
          </p>
          <p className="text-primary/70 text-sm font-medium mt-1 dir-ltr" dir="ltr">{email}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2.5 mb-8" dir="ltr" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isLoading}
              className={`
                w-12 h-14 text-center text-xl font-bold rounded-2xl border transition-all duration-200 outline-none
                bg-white/[0.04] text-white/90
                ${digit ? 'border-primary/40 shadow-[0_0_12px_hsla(144,90%,33%,0.15)]' : 'border-white/[0.08]'}
                focus:border-primary/60 focus:shadow-[0_0_16px_hsla(144,90%,33%,0.25)]
                disabled:opacity-50
              `}
              style={{ boxShadow: digit ? undefined : 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            />
          ))}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="w-full h-13 bg-primary/80 hover:bg-primary text-primary-foreground font-semibold text-sm rounded-2xl relative overflow-hidden"
          style={{ boxShadow: '0 4px 20px hsla(144, 90%, 33%, 0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التحقق...
            </span>
          ) : (
            'تأكيد الرمز'
          )}
        </Button>

        {/* Resend */}
        <div className="text-center mt-6">
          <p className="text-white/25 text-xs mb-2">لم تحصل على الرمز؟</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className={`
              text-sm font-medium transition-colors flex items-center gap-1.5 mx-auto
              ${resendCooldown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-primary/60 hover:text-primary'}
            `}
          >
            <RotateCw className="w-3.5 h-3.5" />
            {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown} ثانية` : 'إعادة إرسال الرمز'}
          </button>
        </div>

        {/* Back */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/signup')}
            className="text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            العودة لصفحة التسجيل
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
