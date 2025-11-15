import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const pinSchema = z.object({
  pin: z.string()
    .min(4, 'رمز PIN يجب أن يكون 4 أرقام على الأقل')
    .max(8, 'رمز PIN يجب أن لا يتجاوز 8 أرقام')
    .regex(/^\d+$/, 'رمز PIN يجب أن يحتوي على أرقام فقط'),
});

const SecretAdminAccess = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Default PIN: 2580 (يمكن تغييره)
  const CORRECT_PIN = '2580';
  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 300; // 5 minutes in seconds

  useEffect(() => {
    // Check if already authenticated
    const authenticated = sessionStorage.getItem('secret_admin_authenticated');
    if (authenticated === 'true') {
      navigate('/admin');
      return;
    }

    // Check if locked
    const lockUntil = localStorage.getItem('secret_admin_lock_until');
    if (lockUntil) {
      const lockTime = parseInt(lockUntil);
      const now = Date.now();
      if (now < lockTime) {
        setIsLocked(true);
        setLockTimer(Math.ceil((lockTime - now) / 1000));
      } else {
        localStorage.removeItem('secret_admin_lock_until');
        localStorage.removeItem('secret_admin_attempts');
      }
    }

    // Load attempts from localStorage
    const storedAttempts = localStorage.getItem('secret_admin_attempts');
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            localStorage.removeItem('secret_admin_lock_until');
            localStorage.removeItem('secret_admin_attempts');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast({
        title: 'مقفل',
        description: `تم قفل الوصول. حاول مرة أخرى بعد ${Math.ceil(lockTimer / 60)} دقيقة`,
        variant: 'destructive',
      });
      return;
    }

    // Validate PIN
    try {
      pinSchema.parse({ pin });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'خطأ في الإدخال',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    // Check PIN
    if (pin === CORRECT_PIN) {
      // Success
      sessionStorage.setItem('secret_admin_authenticated', 'true');
      localStorage.removeItem('secret_admin_attempts');
      localStorage.removeItem('secret_admin_lock_until');
      
      toast({
        title: 'تم التحقق بنجاح',
        description: 'مرحباً بك في لوحة التحكم السرية',
      });
      
      navigate('/admin');
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('secret_admin_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock the page
        const lockUntil = Date.now() + (LOCK_DURATION * 1000);
        localStorage.setItem('secret_admin_lock_until', lockUntil.toString());
        setIsLocked(true);
        setLockTimer(LOCK_DURATION);

        toast({
          title: 'تم قفل الوصول',
          description: `تم تجاوز عدد المحاولات المسموحة. تم قفل الوصول لمدة ${LOCK_DURATION / 60} دقائق`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'رمز PIN خاطئ',
          description: `المحاولات المتبقية: ${MAX_ATTEMPTS - newAttempts}`,
          variant: 'destructive',
        });
      }
      
      setPin('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <Card className="w-full max-w-md bg-gray-900/90 border-primary/20 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            وصول آمن
          </CardTitle>
          <CardDescription className="text-gray-400">
            أدخل رمز PIN للوصول إلى لوحة التحكم السرية
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLocked ? (
            <div className="text-center space-y-4 py-8">
              <Lock className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white mb-2">الوصول مقفل</h3>
                <p className="text-gray-400 mb-4">
                  تم قفل الوصول مؤقتاً بسبب المحاولات الخاطئة المتكررة
                </p>
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTime(lockTimer)}
                </div>
                <p className="text-gray-500 text-sm mt-2">حتى يتم إلغاء القفل</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">رمز PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="أدخل رمز PIN"
                  maxLength={8}
                  className="h-12 text-center text-2xl tracking-widest bg-gray-800 border-gray-700 text-white"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {attempts > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-500 font-semibold">تحذير</p>
                    <p className="text-gray-300">
                      المحاولات المتبقية: {MAX_ATTEMPTS - attempts}
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold text-lg"
              >
                <Lock className="w-5 h-5 mr-2" />
                التحقق
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-white"
                >
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>محمي بنظام أمان متقدم</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hint for demo purposes */}
      <div className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-primary/20 rounded-lg p-4 max-w-xs">
        <p className="text-xs text-gray-400 mb-1">💡 للتجربة:</p>
        <p className="text-sm font-mono text-primary">رمز PIN الافتراضي: 2580</p>
      </div>
    </div>
  );
};

export default SecretAdminAccess;
