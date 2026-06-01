import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import networkLogo from '@/assets/network-logo.png';

const SignUp = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl p-8 bg-white/[0.03] backdrop-blur-[35px] border border-white/[0.08] text-center"
           style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}>
        <div className="w-24 h-24 mx-auto mb-6">
          <img src={networkLogo} alt="Network" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(25,224,91,0.4)]" />
        </div>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white/95 mb-3">التسجيل مغلق</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          هذه المنصة خاصة ومقتصرة على مستخدم واحد فقط.<br/>
          لا يمكن إنشاء حسابات جديدة.
        </p>
        <Button onClick={() => navigate('/login')}
          className="w-full h-12 bg-primary/80 hover:bg-primary text-primary-foreground font-semibold rounded-2xl">
          العودة لتسجيل الدخول
        </Button>
      </div>
    </div>
  );
};

export default SignUp;
