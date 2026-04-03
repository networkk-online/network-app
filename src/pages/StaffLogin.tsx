import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user.id;

      // Check if user has admin or moderator role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      const isOwner = profile?.username === '11556zzaa' || roles?.some(r => r.role === 'admin');
      const isModerator = roles?.some(r => r.role === 'moderator');

      if (isOwner) {
        navigate('/G3142-AF26-0x99', { replace: true });
      } else if (isModerator) {
        navigate('/staff-portal', { replace: true });
      } else {
        // Not staff - log attempt and sign out
        await supabase.from('security_logs').insert({
          user_id: userId,
          attempted_route: '/staff-login',
          action_type: 'non_staff_login_attempt',
          user_agent: navigator.userAgent,
        });
        await supabase.auth.signOut();
        toast({
          title: '⛔ الوصول مرفوض',
          description: 'هذه البوابة مخصصة للموظفين فقط',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({ title: '✅ تم تسجيل الدخول بنجاح' });
    } catch (err: any) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: err.message || 'تحقق من البيانات المدخلة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#39FF14]/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-[#39FF14]/10 border-2 border-[#39FF14]/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(57,255,20,0.15)]">
            <Shield className="w-10 h-10 text-[#39FF14]" />
          </div>
          <h1 className="text-2xl font-bold text-[#39FF14] font-mono tracking-widest">STAFF PORTAL</h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">AUTHORIZED PERSONNEL ONLY</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-400 text-sm">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@networkk.online"
              className="bg-white/5 border-white/10 text-white h-12 focus:border-[#39FF14]/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-400 text-sm">كلمة المرور</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white h-12 focus:border-[#39FF14]/50 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#39FF14] text-black font-bold text-base hover:bg-[#39FF14]/80 shadow-[0_0_30px_rgba(57,255,20,0.2)]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                تسجيل الدخول
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs font-mono flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            محمي بتشفير من الطرف إلى الطرف
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-400 text-xs mt-3 transition-colors"
          >
            العودة للتطبيق
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
