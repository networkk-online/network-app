import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const countryCodes = [
  { code: '+964', country: 'العراق', flag: '🇮🇶' },
  { code: '+966', country: 'السعودية', flag: '🇸🇦' },
  { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
  { code: '+974', country: 'قطر', flag: '🇶🇦' },
  { code: '+965', country: 'الكويت', flag: '🇰🇼' },
  { code: '+968', country: 'عمان', flag: '🇴🇲' },
  { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  { code: '+962', country: 'الأردن', flag: '🇯🇴' },
  { code: '+20', country: 'مصر', flag: '🇪🇬' },
  { code: '+961', country: 'لبنان', flag: '🇱🇧' },
  { code: '+963', country: 'سوريا', flag: '🇸🇾' },
  { code: '+967', country: 'اليمن', flag: '🇾🇪' },
  { code: '+213', country: 'الجزائر', flag: '🇩🇿' },
  { code: '+212', country: 'المغرب', flag: '🇲🇦' },
  { code: '+216', country: 'تونس', flag: '🇹🇳' },
  { code: '+218', country: 'ليبيا', flag: '🇱🇾' },
  { code: '+249', country: 'السودان', flag: '🇸🇩' },
  { code: '+970', country: 'فلسطين', flag: '🇵🇸' },
  { code: '+90', country: 'تركيا', flag: '🇹🇷' },
  { code: '+1', country: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: '+44', country: 'المملكة المتحدة', flag: '🇬🇧' },
];

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+964');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => { if (session) navigate('/'); }); }, [navigate]);

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus('idle'); return; }
    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      const { data, error } = await supabase.from('profiles').select('id').eq('username', username.trim().toLowerCase()).maybeSingle();
      if (error) { setUsernameStatus('idle'); return; }
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken') { toast({ title: 'خطأ', description: 'اسم المستخدم محجوز بالفعل', variant: 'destructive' }); return; }
    if (username.length < 3) { toast({ title: 'خطأ', description: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل', variant: 'destructive' }); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { toast({ title: 'خطأ', description: 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام و _ فقط', variant: 'destructive' }); return; }
    if (password !== confirmPassword) { toast({ title: 'خطأ', description: 'كلمات المرور غير متطابقة', variant: 'destructive' }); return; }
    if (password.length < 6) { toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' }); return; }

    setIsLoading(true);
    try {
      const fullPhoneNumber = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { username: username.trim().toLowerCase(), full_name: fullName, phone_number: fullPhoneNumber } },
      });
      if (error) { toast({ title: 'خطأ في التسجيل', description: error.message === 'User already registered' ? 'هذا البريد الإلكتروني مسجل بالفعل' : error.message, variant: 'destructive' }); return; }
      if (data.user) { toast({ title: 'تم إرسال رمز التحقق', description: 'تفقد بريدك الإلكتروني لإدخال رمز التحقق' }); navigate(`/verify-otp?email=${encodeURIComponent(email)}`); }
    } catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء إنشاء الحساب', variant: 'destructive' }); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignUp = async () => {
    try { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } }); if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); }
    catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء التسجيل بجوجل', variant: 'destructive' }); }
  };

  const handleAppleSignUp = async () => {
    try { const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/` } }); if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); }
    catch { toast({ title: 'خطأ', description: 'حدث خطأ أثناء التسجيل بـ Apple', variant: 'destructive' }); }
  };

  const inputClass = "h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30";
  const inputShadow = { boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 relative rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08] max-h-[90vh] overflow-y-auto scrollbar-hide"
           style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src={networkLogo} alt="Network Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-1 tracking-wide">إنشاء حساب</h1>
        </div>

        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div className="relative">
            <Input type="text" placeholder="اسم المستخدم (بالإنجليزية)" value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              className={`${inputClass} pr-12`} style={inputShadow} required disabled={isLoading} dir="ltr" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-white/20 animate-spin" />}
              {usernameStatus === 'available' && <CheckCircle className="w-4 h-4 text-primary/70" />}
              {usernameStatus === 'taken' && <XCircle className="w-4 h-4 text-destructive/70" />}
            </div>
            {usernameStatus === 'taken' && <p className="text-destructive/50 text-[11px] mt-1 text-right">اسم المستخدم محجوز</p>}
            {usernameStatus === 'available' && <p className="text-primary/40 text-[11px] mt-1 text-right">اسم المستخدم متاح ✓</p>}
          </div>

          <Input type="text" placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className={inputClass} style={inputShadow} disabled={isLoading} />

          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode} disabled={isLoading}>
              <SelectTrigger className="w-28 h-13 bg-white/[0.04] border-white/[0.08] text-white/70 rounded-2xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-black/90 backdrop-blur-xl border-white/[0.08]">
                {countryCodes.map((country) => (
                  <SelectItem key={country.code} value={country.code} className="text-white/70 hover:bg-white/[0.04] focus:bg-white/[0.04] cursor-pointer text-xs">
                    <span className="flex items-center gap-2"><span>{country.flag}</span><span>{country.code}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="tel" placeholder="رقم الهاتف" value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className={`flex-1 ${inputClass}`} style={inputShadow} disabled={isLoading} />
          </div>

          <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputClass} style={inputShadow} required disabled={isLoading} />

          <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
            className={inputClass} style={inputShadow} required disabled={isLoading} />

          <Input type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass} style={inputShadow} required disabled={isLoading} />

          <Button type="submit"
            className="w-full h-13 bg-primary/80 hover:bg-primary text-primary-foreground font-semibold text-sm rounded-2xl"
            style={{ boxShadow: '0 4px 20px hsla(144, 90%, 33%, 0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
            disabled={isLoading || usernameStatus === 'taken'}>
            {isLoading ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />جاري إنشاء الحساب...</span>) : 'إنشاء حساب'}
          </Button>

          <div className="text-center"><span className="text-white/15 text-xs">أو التسجيل بـ</span></div>

          <div className="flex gap-3">
            <Button type="button" onClick={handleGoogleSignUp} variant="outline"
              className="flex-1 h-12 bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] rounded-2xl" disabled={isLoading}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </Button>
            <Button type="button" onClick={handleAppleSignUp} variant="outline"
              className="flex-1 h-12 bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] rounded-2xl" disabled={isLoading}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <span className="text-white/20 text-sm">لديك حساب بالفعل؟ </span>
          <button onClick={() => navigate('/login')} className="text-primary/60 hover:text-primary font-medium text-sm">تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
