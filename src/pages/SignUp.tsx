import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim().toLowerCase();
    // Flexible validation: minimum 1 character. No other restrictions.
    if (u.length < 1) {
      toast({ title: 'خطأ', description: 'اسم المستخدم مطلوب', variant: 'destructive' });
      return;
    }
    if (!email.trim() || !password) {
      toast({ title: 'خطأ', description: 'البريد وكلمة المرور مطلوبان', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Check username availability
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', u).maybeSingle();
      if (existing) {
        toast({ title: 'خطأ', description: 'اسم المستخدم مستخدم بالفعل', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username: u, full_name: fullName.trim() || null },
        },
      });
      if (error) {
        toast({ title: 'خطأ في التسجيل', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'تم إنشاء الحساب', description: 'مرحباً بك في Network' });
      if (data.session) navigate('/');
      else navigate('/login');
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || 'حدث خطأ', variant: 'destructive' });
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

        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="text" placeholder="اسم المستخدم (حرف واحد على الأقل)"
            value={username} onChange={(e) => setUsername(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm text-right focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            required disabled={isLoading} dir="rtl" minLength={1}
          />
          <Input
            type="text" placeholder="الاسم الكامل (اختياري)"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm text-right focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            disabled={isLoading} dir="rtl"
          />
          <Input
            type="email" placeholder="البريد الإلكتروني" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-13 bg-white/[0.04] border-white/[0.08] text-white/90 placeholder-white/20 rounded-2xl text-sm focus:border-primary/30"
            style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
            required disabled={isLoading}
          />
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
