import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import networkLogo from '@/assets/network-logo.png';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: 'بيانات ناقصة', description: 'أدخل البريد الإلكتروني وكلمة المرور', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) {
        toast({ title: 'فشل تسجيل الدخول', description: error?.message || 'البيانات غير صحيحة', variant: 'destructive' });
        return;
      }
      toast({ title: 'تم تسجيل الدخول ✅', description: 'مرحباً بك في نيتورك!' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message ?? 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: 'تنبيه', description: 'أدخل بريدك الإلكتروني أولاً', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الإرسال', description: 'تفقد بريدك الإلكتروني لإعادة تعيين كلمة المرور' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#09090b' }} dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div
        className="w-full max-w-md z-10 relative rounded-3xl p-8 border border-emerald-500/15"
        style={{
          backgroundColor: '#121214',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 40px rgba(16,185,129,0.08)',
        }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img
              src={networkLogo}
              alt="Network"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            />
          </div>
          <h1 className="text-2xl font-bold text-white/95 tracking-wide">تسجيل الدخول إلى حسابك</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-2 text-right">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              dir="rtl"
              autoComplete="email"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-right focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2 text-right">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              dir="rtl"
              autoComplete="current-password"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-right focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            تسجيل الدخول
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-emerald-400/70 hover:text-emerald-400 text-sm transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
