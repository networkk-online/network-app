import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import networkLogo from '@/assets/network-logo.png';

const countryCodes = [
  { code: '+966', country: 'السعودية', flag: '🇸🇦' },
  { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
  { code: '+974', country: 'قطر', flag: '🇶🇦' },
  { code: '+965', country: 'الكويت', flag: '🇰🇼' },
  { code: '+968', country: 'عمان', flag: '🇴🇲' },
  { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  { code: '+962', country: 'الأردن', flag: '🇯🇴' },
  { code: '+20', country: 'مصر', flag: '🇪🇬' },
  { code: '+964', country: 'العراق', flag: '🇮🇶' },
  { code: '+961', country: 'لبنان', flag: '🇱🇧' },
  { code: '+963', country: 'سوريا', flag: '🇸🇾' },
  { code: '+967', country: 'اليمن', flag: '🇾🇪' },
  { code: '+213', country: 'الجزائر', flag: '🇩🇿' },
  { code: '+212', country: 'المغرب', flag: '🇲🇦' },
  { code: '+216', country: 'تونس', flag: '🇹🇳' },
  { code: '+218', country: 'ليبيا', flag: '🇱🇾' },
  { code: '+249', country: 'السودان', flag: '🇸🇩' },
  { code: '+222', country: 'موريتانيا', flag: '🇲🇷' },
  { code: '+970', country: 'فلسطين', flag: '🇵🇸' },
  { code: '+1', country: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: '+44', country: 'المملكة المتحدة', flag: '🇬🇧' },
  { code: '+33', country: 'فرنسا', flag: '🇫🇷' },
  { code: '+49', country: 'ألمانيا', flag: '🇩🇪' },
  { code: '+90', country: 'تركيا', flag: '🇹🇷' },
  { code: '+91', country: 'الهند', flag: '🇮🇳' },
  { code: '+92', country: 'باكستان', flag: '🇵🇰' },
  { code: '+86', country: 'الصين', flag: '🇨🇳' },
];

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username,
            full_name: fullName,
            phone_number: fullPhoneNumber,
          },
        },
      });

      if (error) {
        toast({
          title: 'خطأ في التسجيل',
          description: error.message === 'User already registered' 
            ? 'هذا البريد الإلكتروني مسجل بالفعل'
            : error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        toast({
          title: 'تم إنشاء الحساب بنجاح',
          description: 'مرحباً بك!',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء الحساب',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        description: 'حدث خطأ أثناء التسجيل بجوجل',
        variant: 'destructive',
      });
    }
  };

  const handleAppleSignUp = async () => {
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
        description: 'حدث خطأ أثناء التسجيل بـ Apple',
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
          <h1 className="text-3xl font-bold text-white mb-2">إنشاء حساب</h1>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              type="text"
              placeholder="الاسم الكامل"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode} disabled={isLoading}>
                <SelectTrigger className="w-32 h-14 bg-gray-900 border-gray-700 text-white rounded-xl text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-gray-900 border-gray-700">
                  {countryCodes.map((country) => (
                    <SelectItem 
                      key={country.code} 
                      value={country.code}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="رقم الهاتف"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1 h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
              disabled={isLoading}
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

          <div>
            <Input
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-xl text-lg"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/25"
            disabled={isLoading}
          >
            {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>

          <div className="text-center">
            <span className="text-gray-400 text-lg">or</span>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full h-14 bg-transparent border-gray-700 text-white hover:bg-gray-900 rounded-xl"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>

          <Button
            type="button"
            onClick={handleAppleSignUp}
            variant="outline"
            className="w-full h-14 bg-transparent border-gray-700 text-white hover:bg-gray-900 rounded-xl"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Sign up with Apple
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8">
          <span className="text-gray-400">لديك حساب بالفعل؟ </span>
          <button
            onClick={() => navigate('/login')}
            className="text-green-500 hover:text-green-400 font-semibold"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
