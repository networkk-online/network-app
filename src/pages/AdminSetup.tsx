import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle } from 'lucide-react';

const AdminSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  useEffect(() => {
    checkUserAndRole();
  }, []);

  const checkUserAndRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "غير مسجل دخول",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    setUser(user);

    // التحقق من وجود دور أدمن
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleData) {
      setHasAdminRole(true);
    }
  };

  const makeAdmin = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح! ✅",
        description: "تم إضافة صلاحيات الأدمن لحسابك",
      });

      setHasAdminRole(true);

      // الانتقال إلى لوحة التحكم بعد 2 ثانية
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إضافة الصلاحيات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">إعداد صلاحيات الأدمن</CardTitle>
          <CardDescription className="text-gray-400">
            اجعل حسابك حساب مدير للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasAdminRole ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <p className="text-green-400 font-medium">
                لديك بالفعل صلاحيات الأدمن!
              </p>
              <Button 
                onClick={() => navigate('/admin')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                الانتقال إلى لوحة التحكم
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-sm text-blue-300">
                <p className="mb-2">📋 معلومات:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>ستحصل على صلاحيات كاملة لإدارة المنصة</li>
                  <li>يمكنك إدارة المستخدمين والمحتوى</li>
                  <li>الوصول إلى جميع الإحصائيات والتقارير</li>
                </ul>
              </div>

              <Button 
                onClick={makeAdmin}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "جاري الإضافة..." : "إضافة صلاحيات الأدمن لحسابي"}
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
