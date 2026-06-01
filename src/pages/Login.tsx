import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserDataLogger } from '@/hooks/useUserDataLogger';
import { Loader2 } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAddAccount = searchParams.get('add_account') === 'true';
  const { toast } = useToast();
  const { logLogin } = useUserDataLogger();

  const isPhoneInput = /^[\d\+٠-٩]/.test(identifier.trim());
  const isEmailInput = identifier.trim().includes('@');
  const isUsernameInput = !isPhoneInput && !isEmailInput && identifier.trim().length > 0;
  const inputMode = isPhoneInput ? 'tel' as const : 'text' as const;

  const resolveEmail = async (input: string): Promise<string | null> => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed;
    if (/^[\d\+٠-٩]/.test(trimmed)) {
      let phone = trimmed.replace(/\s+/g, '');
      if (phone.startsWith('07')) phone = '+964' + phone.slice(1);
      else if (phone.startsWith('964')) phone = '+' + phone;
      return phone;
    }
    try {
      const { data, error } = await supabase.functions.invoke('lookup-username', { body: { username: trimmed.toLowerCase() } });
      if (error || !data?.email) { toast({ title: 'خطأ', description: 'اسم المستخدم غير موجود', variant: 'destructive' }); return null; }
      return data.email;
    } catch { toast({ title: 'خطأ', description: 'تعذر البحث عن اسم المستخدم', variant: 'destructive' }); return null; }
  };

  useEffect(() => {
    // If adding account, sign out current session first (tokens are saved by useAccountSwitcher)
    if (isAddAccount) {
      supabase.auth.signOut();
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) navigate('/'); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') { logLogin(session.user.id); navigate('/'); }
    });
    return () => subscription.unsubscribe();
  }, [navigate, logLogin, isAddAccount]);

  const OWNER_USERNAME = '11556zzaa';

  const enforceSingleUser = async (userId: string): Promise<boolean> => {
    const { data: profile } = await supabase
      .from('profiles').select('username').eq('id', userId).single();
    if (profile?.username !== OWNER_USERNAME) {
      await supabase.auth.signOut();
      toast({
        title: 'منصة خاصة',
        description: 'هذه المنصة خاصة ومقتصرة على مستخدم واحد فقط',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const trimmed = identifier.trim();
      const isEmail = trimmed.includes('@');
      const isPhone = /^[\d\+٠-٩]/.test(trimmed);
      const isUsername = !isEmail && !isPhone;

      if (isUsername) {
        const { data: r, error: rErr } = await supabase.functions.invoke('lookup-username', {
          body: { username: trimmed.toLowerCase(), password },
        });
        if (rErr || !r?.session) {
          toast({ title: 'خطأ في تسجيل الدخول', description: r?.error || 'اسم المستخدم أو كلمة المرور غير صحيحة', variant: 'destructive' });
          return;
        }
        const { data: setData, error: setErr } = await supabase.auth.setSession({
          access_token: r.session.access_token,
          refresh_token: r.session.refresh_token,
        });
        if (setErr || !setData.session) {
          toast({ title: 'خطأ', description: 'تعذر إنشاء الجلسة', variant: 'destructive' });
          return;
        }
        if (!(await enforceSingleUser(setData.session.user.id))) return;
        logLogin(setData.session.user.id);
        navigate('/');
        return;
      }

      let loginIdentifier = trimmed;
      if (isPhone) {
        let phone = trimmed.replace(/\s+/g, '');
        if (phone.startsWith('07')) phone = '+964' + phone.slice(1);
        else if (phone.startsWith('964')) phone = '+' + phone;
        loginIdentifier = phone;
      }
      const credentials = isPhone
        ? ({ phone: loginIdentifier, password } as any)
        : { email: loginIdentifier, password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error || !data.session) {
        toast({ title: 'خطأ في تسجيل الدخول', description: 'البيانات غير صحيحة', variant: 'destructive' });
        return;
      }
      if (!(await enforceSingleUser(data.session.user.id))) return;
      logLogin(data.session.user.id);
      navigate('/');
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء تسجيل الدخول', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  };


  const handleGoogleSignIn = async () => {
    try { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } }); if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); }
    catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء تسجيل الدخول بجوجل', variant: 'destructive' }); }
  };

  const handleAppleSignIn = async () => {
    try { const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/` } }); if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); }
    catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء تسجيل الدخول بـ Apple', variant: 'destructive' }); }
  };

  const handleForgotPassword = async () => {
    if (!identifier) { toast({ title: 'تنبيه', description: 'أدخل بريدك الإلكتروني أو اسم المستخدم أولاً', variant: 'destructive' }); return; }
    try {
      const email = await resolveEmail(identifier);
      if (!email) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'تم إرسال رابط إعادة التعيين', description: 'تفقد بريدك الإلكتروني' });
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء إعادة تعيين كلمة المرور', variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 relative rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08]"
           style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-28 h-28 mx-auto mb-6">
            <img src={networkLogo} alt="Network Logo" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(25,224,91,0.4)]" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-1 tracking-wide">أهلاً بكم في العالم الجديد</h1>
          <p className="text-primary/50 text-sm">تسجيل الدخول</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              type="text" inputMode={inputMode}
              placeholder="اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm text-right focus:border-primary/30"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              required disabled={isLoading} dir="rtl"
            />
            {isUsernameInput && <p className="text-primary/40 text-[11px] mt-1 text-right">سيتم البحث باسم المستخدم</p>}
          </div>

          <Input
            type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            required disabled={isLoading}
          />

          <div className="text-center">
            <button type="button" onClick={handleForgotPassword} className="text-white/25 hover:text-white/50 transition-colors text-xs">نسيت كلمة المرور؟</button>
          </div>

          <Button type="submit"
            className="w-full h-13 bg-primary/80 hover:bg-primary text-primary-foreground font-semibold text-sm rounded-2xl relative overflow-hidden"
            style={{ boxShadow: '0 4px 20px hsla(144, 90%, 33%, 0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
            disabled={isLoading}>
            {isLoading ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />جاري تسجيل الدخول...</span>) : 'تسجيل الدخول'}
          </Button>

          <Button type="button" onClick={() => navigate('/signup')} variant="outline"
            className="w-full h-13 bg-transparent border-white/[0.08] text-white/60 hover:bg-white/[0.03] hover:text-white/80 font-medium text-sm rounded-2xl">
            إنشاء حساب
          </Button>

          <div className="text-center"><span className="text-white/15 text-xs">أو تسجيل الدخول بـ</span></div>

          <div className="flex gap-3">
            <Button type="button" onClick={handleGoogleSignIn} variant="outline"
              className="flex-1 h-12 bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] rounded-2xl" disabled={isLoading}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </Button>
            <Button type="button" onClick={handleAppleSignIn} variant="outline"
              className="flex-1 h-12 bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] rounded-2xl" disabled={isLoading}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
