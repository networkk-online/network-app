import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserDataLogger } from '@/hooks/useUserDataLogger';
import networkLogo from '@/assets/network-logo.png';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logLogin } = useUserDataLogger();

  const isPhoneInput = /^[\d\+٠-٩]/.test(identifier.trim());
  const inputMode = isPhoneInput ? 'tel' as const : 'email' as const;

  const resolveEmail = (input: string): string => {
    const trimmed = input.trim();
    // If it looks like an email, return as-is
    if (trimmed.includes('@')) return trimmed;
    // Iraqi phone: normalize to email-compatible format if needed
    let phone = trimmed.replace(/\s+/g, '');
    if (phone.startsWith('07')) {
      phone = '+964' + phone.slice(1);
    } else if (phone.startsWith('964')) {
      phone = '+' + phone;
    }
    // Return phone as identifier (Supabase phone auth or lookup)
    return phone;
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        // تسجيل بيانات الدخول في الخلفية
        logLogin(session.user.id);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, logLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginId = resolveEmail(identifier);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginId,
        password,
      });

      if (error) {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: error.message === 'Invalid login credentials' 
            ? 'البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة'
            : error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.session) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك مجدداً!',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول بجوجل',
        variant: 'destructive',
      });
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول بـ Apple',
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier) {
      toast({
        title: 'أدخل بريدك الإلكتروني أو رقم هاتفك',
        description: 'الرجاء إدخال بريدك الإلكتروني أو رقم هاتفك أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resolveEmail(identifier), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'خطأ',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم إرسال رابط إعادة التعيين',
        description: 'تفقد بريدك الإلكتروني',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إعادة تعيين كلمة المرور',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-green-400/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-green-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-green-300 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-green-500 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-1 h-1 bg-green-400 rounded-full animate-bounce delay-1500"></div>
        
        {/* App-specific Emojis */}
        <div className="absolute top-16 left-1/4 text-2xl animate-bounce delay-300">❤️</div>
        <div className="absolute top-32 right-1/3 text-xl animate-bounce delay-700">💬</div>
        <div className="absolute top-1/2 left-16 text-lg animate-bounce delay-1200">📱</div>
        <div className="absolute bottom-32 right-16 text-2xl animate-bounce delay-1600">🔥</div>
        <div className="absolute top-48 left-1/2 text-xl animate-bounce delay-2000">📸</div>
        <div className="absolute bottom-48 left-1/4 text-lg animate-bounce delay-400">🌟</div>
        <div className="absolute top-64 right-20 text-xl animate-bounce delay-800">👥</div>
        <div className="absolute bottom-16 left-1/2 text-lg animate-bounce delay-1400">🚀</div>
        <div className="absolute top-20 left-2/3 text-xl animate-bounce delay-600">💫</div>
        <div className="absolute bottom-40 right-1/3 text-lg animate-bounce delay-1800">🎯</div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-30"></div>
      </div>
      <div className="w-full max-w-md z-10 relative backdrop-blur-sm bg-black/20 rounded-2xl border border-green-500/20 p-8 shadow-2xl shadow-green-500/10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <img 
              src={networkLogo} 
              alt="Network Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">أهلاً بكم في العالم الجديد</h1>
          <p className="text-green-400 text-lg">تسجيل الدخول</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Input
              type="text"
              inputMode={inputMode}
              placeholder="البريد الإلكتروني أو رقم الهاتف"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg text-right"
              required
              disabled={isLoading}
              dir="rtl"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/25"
            disabled={isLoading}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>

          <Button
            type="button"
            onClick={() => navigate('/signup')}
            variant="outline"
            className="w-full h-14 bg-transparent border-green-500 text-green-500 hover:bg-green-500/10 font-semibold text-lg rounded-xl"
          >
            إنشاء حساب
          </Button>

          <div className="text-center">
            <span className="text-gray-400 text-sm">أو تسجيل الدخول بـ</span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="flex-1 h-12 bg-transparent border-gray-700 text-white hover:bg-gray-900 rounded-xl"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </Button>

            <Button
              type="button"
              onClick={handleAppleSignIn}
              variant="outline"
              className="flex-1 h-12 bg-transparent border-gray-700 text-white hover:bg-gray-900 rounded-xl"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
