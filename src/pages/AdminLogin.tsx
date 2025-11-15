import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { z } from "zod";

const pinSchema = z.object({
  pin: z.string()
    .min(4, 'رمز PIN يجب أن يكون 4 أرقام على الأقل')
    .max(8, 'رمز PIN يجب أن لا يتجاوز 8 أرقام')
    .regex(/^\d+$/, 'رمز PIN يجب أن يحتوي على أرقام فقط'),
});

const AdminLogin = () => {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default PIN: 2580 (يمكن تغييره)
  const CORRECT_PIN = '2580';
  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 300; // 5 minutes in seconds

  useEffect(() => {
    // Check if already authenticated
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      navigate('/admin');
      return;
    }

    // Check if locked
    const lockUntil = localStorage.getItem('admin_lock_until');
    if (lockUntil) {
      const lockTime = parseInt(lockUntil);
      const now = Date.now();
      if (now < lockTime) {
        setIsLocked(true);
        setLockTimer(Math.ceil((lockTime - now) / 1000));
      } else {
        localStorage.removeItem('admin_lock_until');
        localStorage.removeItem('admin_attempts');
      }
    }

    // Load attempts from localStorage
    const storedAttempts = localStorage.getItem('admin_attempts');
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
            localStorage.removeItem('admin_lock_until');
            localStorage.removeItem('admin_attempts');
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
      sessionStorage.setItem('admin_authenticated', 'true');
      localStorage.removeItem('admin_attempts');
      localStorage.removeItem('admin_lock_until');
      
      toast({
        title: 'تم التحقق بنجاح',
        description: 'مرحباً بك في لوحة التحكم',
      });
      
      navigate('/admin');
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('admin_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock the page
        const lockUntil = Date.now() + (LOCK_DURATION * 1000);
        localStorage.setItem('admin_lock_until', lockUntil.toString());
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">لوحة التحكم</CardTitle>
          <CardDescription className="text-base">
            أدخل رمز PIN للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLocked ? (
            <div className="text-center space-y-4 py-8">
              <Lock className="w-16 h-16 text-destructive mx-auto" />
              <div>
                <h3 className="text-xl font-bold mb-2">الوصول مقفل</h3>
                <p className="text-muted-foreground mb-4">
                  تم قفل الوصول مؤقتاً بسبب المحاولات الخاطئة المتكررة
                </p>
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTime(lockTimer)}
                </div>
                <p className="text-muted-foreground text-sm mt-2">حتى يتم إلغاء القفل</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin">رمز PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="أدخل رمز PIN"
                  maxLength={8}
                  className="h-12 text-center text-2xl tracking-widest"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {attempts > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-yellow-500 font-semibold">تحذير</p>
                    <p className="text-foreground">
                      المحاولات المتبقية: {MAX_ATTEMPTS - attempts}
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg"
              >
                <Lock className="w-5 h-5 mr-2" />
                التحقق
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  العودة للصفحة الرئيسية
                </Button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>محمي بنظام أمان متقدم</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hint for demo purposes */}
      <div className="fixed bottom-4 right-4 bg-card backdrop-blur-sm border rounded-lg p-4 max-w-xs shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">💡 للتجربة:</p>
        <p className="text-sm font-mono text-primary">رمز PIN الافتراضي: 2580</p>
      </div>
    </div>
  );
};

export default AdminLogin;
