import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2 } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const StealthLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCredentials = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-otp', {
        body: { action: 'send', email, password },
      });

      if (error || data?.error) {
        toast({
          title: 'خطأ',
          description: data?.error || 'فشل في المصادقة',
          variant: 'destructive',
        });
        return;
      }

      setUserId(data.userId);
      if (data.debug_otp) setDebugOtp(data.debug_otp);
      setStep('otp');
      toast({
        title: 'تم إرسال رمز التحقق',
        description: 'تحقق من بريدك الإلكتروني',
      });
    } catch (err) {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-otp', {
        body: { action: 'verify', code: otp, userId },
      });

      if (error || data?.error) {
        toast({
          title: 'رمز غير صحيح',
          description: data?.error || 'حاول مرة أخرى',
          variant: 'destructive',
        });
        setOtp('');
        return;
      }

      // Sign in on the client side
      await supabase.auth.signInWithPassword({ email, password });
      sessionStorage.setItem('stealth_verified', 'true');
      navigate('/system-panel');
    } catch (err) {
      toast({ title: 'خطأ في التحقق', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-sm">
        {/* Terminal-style header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src={networkLogo} alt="Network Logo" className="w-14 h-14 object-contain drop-shadow-[0_0_20px_rgba(0,255,65,0.3)]" />
          <h1 className="text-lg font-mono tracking-widest text-[#00ff41] uppercase">
            System Access
          </h1>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 shadow-2xl shadow-[#00ff41]/5">
          {step === 'credentials' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  Identifier
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@domain.com"
                  className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm placeholder:text-gray-600 focus:border-[#00ff41]/50 focus:ring-[#00ff41]/20"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  Passphrase
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm placeholder:text-gray-600 focus:border-[#00ff41]/50 focus:ring-[#00ff41]/20"
                  dir="ltr"
                  onKeyDown={(e) => e.key === 'Enter' && handleCredentials()}
                />
              </div>

              <Button
                onClick={handleCredentials}
                disabled={loading || !email || !password}
                className="w-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 font-mono uppercase tracking-wider text-xs h-11"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Authenticate'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Lock className="h-8 w-8 text-[#00ff41]/60 mx-auto" />
                <p className="text-xs font-mono text-gray-500">
                  Enter 6-digit verification code
                </p>
                {debugOtp && (
                  <p className="text-xs font-mono text-yellow-500/60">
                    [DEV] Code: {debugOtp}
                  </p>
                )}
              </div>

              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="bg-[#0a0a0a] border-[#222] text-[#00ff41] font-mono text-lg w-11 h-12"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 font-mono uppercase tracking-wider text-xs h-11"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enter'}
              </Button>

              <button
                onClick={() => { setStep('credentials'); setOtp(''); setDebugOtp(''); }}
                className="w-full text-xs font-mono text-gray-600 hover:text-gray-400 transition"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] font-mono text-gray-700 mt-4">
          Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
};

export default StealthLogin;
