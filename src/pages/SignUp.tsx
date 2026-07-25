import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, Phone, Sparkles, User as UserIcon, Briefcase } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';
import {
  COUNTRY_PHONE_RULES,
  DEFAULT_COUNTRY_CODE,
  getCountryRule,
  onlyDigits,
  toE164,
  validateNationalNumber,
} from '@/lib/countryPhoneRules';

type Mode = 'email' | 'phone';
type AccountType = 'creator' | 'personal' | 'business';

const SPECIALTIES: Record<AccountType, { value: string; labelAr: string }[]> = {
  creator: [
    { value: 'gaming', labelAr: 'ألعاب' },
    { value: 'video', labelAr: 'فيديو' },
    { value: 'art', labelAr: 'فن' },
    { value: 'photography', labelAr: 'تصوير' },
    { value: 'tech', labelAr: 'تقنية' },
    { value: 'music', labelAr: 'موسيقى' },
    { value: 'fashion', labelAr: 'أزياء' },
    { value: 'other', labelAr: 'أخرى' },
  ],
  personal: [
    { value: 'lifestyle', labelAr: 'أسلوب حياة' },
    { value: 'travel', labelAr: 'سفر' },
    { value: 'sports', labelAr: 'رياضة' },
    { value: 'other', labelAr: 'أخرى' },
  ],
  business: [
    { value: 'tech', labelAr: 'تقنية' },
    { value: 'commerce', labelAr: 'تجارة' },
    { value: 'food', labelAr: 'مأكولات' },
    { value: 'services', labelAr: 'خدمات' },
    { value: 'health', labelAr: 'صحة' },
    { value: 'education', labelAr: 'تعليم' },
    { value: 'other', labelAr: 'أخرى' },
  ],
};

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [specialty, setSpecialty] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const normalizeUsername = (value: string) => value.replace(/^@+/, '').trim().toLowerCase();

  const reportAuthError = (error: unknown, title = 'SUPABASE AUTH ERROR') => {
    console.error('SUPABASE AUTH ERROR:', error);
    const message = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message || JSON.stringify(error))
        : String(error || 'Unknown auth error');
    toast({ title, description: message, variant: 'destructive' });
    return message;
  };

  const rule = useMemo(() => getCountryRule(countryCode), [countryCode]);
  const expectedLengths = Array.isArray(rule.nationalLength) ? rule.nationalLength : [rule.nationalLength];
  const maxLen = Math.max(...expectedLengths);
  const phoneDigits = onlyDigits(phone);
  const phoneValid = validateNationalNumber(rule, phone);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Normalize: strip leading @ and lowercase so '@M' and 'M' behave identically
    const u = normalizeUsername(username);
    if (!password) {
      toast({ title: 'خطأ', description: 'كلمة المرور مطلوبة', variant: 'destructive' });
      return;
    }

    if (mode === 'email' && !email.trim()) {
      toast({ title: 'خطأ', description: 'البريد مطلوب', variant: 'destructive' });
      return;
    }
    if (mode === 'phone') {
      if (!phoneValid) {
        const lenLabel = expectedLengths.join(' أو ');
        toast({
          title: 'رقم غير صالح',
          description: `يجب أن يتكون رقم ${rule.nameAr} من ${lenLabel} رقماً (مثال: ${rule.example})`,
          variant: 'destructive',
        });
        return;
      }
    }

    const goToLogin = () => setTimeout(() => navigate('/login'), 1200);

    setIsLoading(true);
    try {
      const { data: existing, error: existingError } = await supabase
        .from('profiles').select('id').ilike('username', u).maybeSingle();

      if (existingError) {
        reportAuthError(existingError, 'PROFILE LOOKUP ERROR');
      }

      if (existing) {
        const credentials = mode === 'phone'
          ? ({ phone: toE164(rule, phone), password } as any)
          : { email: email.trim().toLowerCase(), password };
        const { data: existingSignIn, error: existingSignInError } = await supabase.auth.signInWithPassword(credentials);
        if (existingSignInError || !existingSignIn.session) {
          if (existingSignInError) {
            const raw = reportAuthError(existingSignInError);
            if (raw.toLowerCase().includes('email not confirmed')) {
              toast({
                title: 'Email not confirmed',
                description: 'Please confirm your email address or disable Email Confirmation in Supabase settings.',
                variant: 'destructive',
              });
            }
          }
          toast({
            title: 'هذا الحساب موجود بالفعل',
            description: 'اسم المستخدم مسجّل. يرجى تسجيل الدخول بدلاً من ذلك.',
            variant: 'destructive',
          });
          goToLogin();
          return;
        }
        toast({ title: 'تم تسجيل الدخول', description: 'الحساب موجود بالفعل وتم تسجيل دخولك.' });
        navigate('/');
        return;
      }

      if (u.length < 5) {
        toast({ title: 'اسم مستخدم غير صالح', description: 'اسم المستخدم يجب أن يكون من 5 أحرف أو أكثر. اليوزرات الرباعية فما دون غير مسموحة.', variant: 'destructive' });
        return;
      }

      const signUpPayload: any = {
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username: u, full_name: fullName.trim() || null },
        },
      };

      if (mode === 'email') {
        signUpPayload.email = email.trim().toLowerCase();
      } else {
        signUpPayload.phone = toE164(rule, phone);
      }

      const { data, error } = await supabase.auth.signUp(signUpPayload);
      if (error) {
        console.error('SUPABASE AUTH ERROR:', error);
        const msg = (error.message || '').toLowerCase();
        const isDup =
          msg.includes('already registered') ||
          msg.includes('already been registered') ||
          msg.includes('already exists') ||
          msg.includes('user already') ||
          (error as any).status === 409 ||
          (error as any).code === 'user_already_exists';
        if (isDup) {
          const credentials = mode === 'phone'
            ? ({ phone: toE164(rule, phone), password } as any)
            : { email: email.trim().toLowerCase(), password };

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(credentials);
          if (signInError || !signInData.session) {
            if (signInError) {
              const raw = reportAuthError(signInError);
              if (raw.toLowerCase().includes('email not confirmed')) {
                toast({
                  title: 'Email not confirmed',
                  description: 'Please confirm your email address or disable Email Confirmation in Supabase settings.',
                  variant: 'destructive',
                });
              }
            } else {
              toast({ title: 'SUPABASE AUTH ERROR', description: error.message, variant: 'destructive' });
            }
            goToLogin();
            return;
          }
          toast({ title: 'تم تسجيل الدخول', description: 'الحساب موجود بالفعل وتم تسجيل دخولك.' });
          navigate('/');
        } else if (msg.includes('password')) {
          toast({ title: 'SUPABASE AUTH ERROR', description: error.message, variant: 'destructive' });
        } else if (msg.includes('email')) {
          if (msg.includes('email not confirmed')) {
            toast({
              title: 'Email not confirmed',
              description: 'Please confirm your email address or disable Email Confirmation in Supabase settings.',
              variant: 'destructive',
            });
          } else {
            toast({ title: 'SUPABASE AUTH ERROR', description: error.message, variant: 'destructive' });
          }
        } else if (msg.includes('phone')) {
          toast({ title: 'SUPABASE AUTH ERROR', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'SUPABASE AUTH ERROR', description: error.message, variant: 'destructive' });
        }
        return;
      }

      // Persist account_type + specialty on the profile (created by handle_new_user trigger)
      if (data.user) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ account_type: accountType, specialty: specialty || null })
          .eq('id', data.user.id);

        if (profileUpdateError) reportAuthError(profileUpdateError, 'PROFILE UPDATE ERROR');
      }

      toast({ title: 'تم إنشاء الحساب', description: 'مرحباً بك في Network' });
      if (data.session) navigate('/');
      else navigate('/login');
    } catch (err: any) {
      reportAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 relative rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08]"
           style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5">
            <img src={networkLogo} alt="Network" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(25,224,91,0.4)]" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 mb-1 tracking-wide">إنشاء حساب جديد</h1>
          <p className="text-primary/50 text-sm">انضم إلى Network</p>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
          <button type="button" onClick={() => setMode('email')}
            className={`h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all ${mode === 'email' ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white/80'}`}>
            <Mail className="w-4 h-4" /> البريد
          </button>
          <button type="button" onClick={() => setMode('phone')}
            className={`h-10 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all ${mode === 'phone' ? 'bg-primary/20 text-primary' : 'text-white/50 hover:text-white/80'}`}>
            <Phone className="w-4 h-4" /> الهاتف
          </button>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="text" placeholder="اسم المستخدم (5 أحرف على الأقل)"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm text-right focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            required disabled={isLoading} dir="rtl"
          />
          <Input
            type="text" placeholder="الاسم الكامل (اختياري)"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm text-right focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            disabled={isLoading} dir="rtl"
          />

          {mode === 'email' ? (
            <Input
              type="email" placeholder="البريد الإلكتروني" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              required disabled={isLoading}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => { setCountryCode(e.target.value); setPhone(''); }}
                  disabled={isLoading}
                  className="h-13 w-32 bg-white/[0.04] border border-white/[0.08] text-white/90 rounded-2xl text-xs px-2 focus:border-primary/30 focus:outline-none"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
                >
                  {COUNTRY_PHONE_RULES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-black text-white">
                      {c.nameAr} +{c.dial}
                    </option>
                  ))}
                </select>
                <Input
                  type="tel" inputMode="numeric"
                  placeholder={rule.example}
                  value={phone}
                  onChange={(e) => setPhone(onlyDigits(e.target.value).slice(0, maxLen))}
                  className="h-13 flex-1 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', direction: 'ltr' }}
                  required disabled={isLoading} maxLength={maxLen}
                />
              </div>
              <p className={`text-[11px] text-right ${phoneValid ? 'text-primary/70' : 'text-white/40'}`}>
                {phoneValid
                  ? `✓ رقم صالح — ${toE164(rule, phone)}`
                  : `${rule.nameAr}: ${expectedLengths.join(' أو ')} رقماً (${phoneDigits.length}/${maxLen})`}
              </p>
            </div>
          )}

          {/* Account type */}
          <div>
            <label className="block text-[11px] text-white/50 mb-2 text-right">نوع الحساب</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'creator', label: 'منشئ محتوى', Icon: Sparkles },
                { key: 'personal', label: 'شخصي', Icon: UserIcon },
                { key: 'business', label: 'تجاري', Icon: Briefcase },
              ] as const).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setAccountType(key); setSpecialty(''); }}
                  disabled={isLoading}
                  className={`h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all ${
                    accountType === key
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white/90'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-[11px] text-white/50 mb-2 text-right">اختر الاختصاص</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              disabled={isLoading}
              className="w-full h-13 bg-white/[0.04] border border-white/[0.08] text-white/90 rounded-2xl text-sm px-3 focus:border-primary/30 focus:outline-none text-right"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            >
              <option value="" className="bg-black text-white/60">— اختر الاختصاص —</option>
              {SPECIALTIES[accountType].map((s) => (
                <option key={s.value} value={s.value} className="bg-black text-white">{s.labelAr}</option>
              ))}
            </select>
          </div>


          <Input
            type="password" placeholder="كلمة المرور" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            required disabled={isLoading} minLength={6}
          />

          <Button type="submit"
            className="w-full h-13 bg-primary/80 hover:bg-primary text-primary-foreground font-semibold text-sm rounded-2xl relative overflow-hidden"
            style={{ boxShadow: '0 4px 20px hsla(144, 90%, 33%, 0.2), inset 0 1px 0 0 rgba(255,255,255,0.1)' }}
            disabled={isLoading}>
            {isLoading ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />جاري إنشاء الحساب...</span>) : 'إنشاء حساب'}
          </Button>

          <div className="text-center pt-2">
            <button type="button" onClick={() => navigate('/login')} className="text-white/40 hover:text-white/70 transition-colors text-xs">
              لديك حساب؟ تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
