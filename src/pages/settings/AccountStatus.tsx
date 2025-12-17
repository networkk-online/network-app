import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, AlertCircle, Clock, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AccountInfo {
  username: string;
  email: string;
  is_verified: boolean;
  created_at: string;
  verification_status: 'none' | 'pending' | 'approved' | 'rejected';
}

const AccountStatus = () => {
  const navigate = useNavigate();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountInfo();
  }, []);

  const loadAccountInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, is_verified, created_at')
        .eq('id', user.id)
        .single();

      const { data: verificationRequest } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let verificationStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      if (profile?.is_verified) {
        verificationStatus = 'approved';
      } else if (verificationRequest) {
        verificationStatus = verificationRequest.status as any;
      }

      setAccountInfo({
        username: profile?.username || '',
        email: user.email || '',
        is_verified: profile?.is_verified || false,
        created_at: profile?.created_at || '',
        verification_status: verificationStatus,
      });
    } catch (error) {
      console.error('Error loading account info:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          reason: 'طلب توثيق الحساب',
          status: 'pending',
        });

      if (error) throw error;

      setAccountInfo(prev => prev ? { ...prev, verification_status: 'pending' } : null);
      toast({
        title: "تم إرسال الطلب",
        description: "سيتم مراجعة طلبك قريباً",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">حالة الحساب</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Account Overview */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="font-bold">معلومات الحساب</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">اسم المستخدم</span>
              <span className="font-medium">@{accountInfo?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">البريد الإلكتروني</span>
              <span className="font-medium">{accountInfo?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">تاريخ الانضمام</span>
              <span className="font-medium">
                {accountInfo?.created_at 
                  ? new Date(accountInfo.created_at).toLocaleDateString('ar-SA')
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <BadgeCheck className="w-6 h-6 text-primary" />
            <h3 className="font-bold">حالة التوثيق</h3>
          </div>

          {accountInfo?.verification_status === 'approved' ? (
            <div className="flex items-center gap-3 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span>حسابك موثق</span>
            </div>
          ) : accountInfo?.verification_status === 'pending' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-yellow-500">
                <Clock className="w-5 h-5" />
                <span>طلبك قيد المراجعة</span>
              </div>
              <p className="text-sm text-muted-foreground">
                سيتم إعلامك عند اتخاذ قرار بشأن طلبك
              </p>
            </div>
          ) : accountInfo?.verification_status === 'rejected' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span>تم رفض طلبك السابق</span>
              </div>
              <Button onClick={requestVerification} variant="outline" className="w-full">
                إعادة التقديم
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                حسابك غير موثق. يمكنك طلب التوثيق للحصول على شارة التحقق.
              </p>
              <Button onClick={requestVerification} className="w-full">
                طلب التوثيق
              </Button>
            </div>
          )}
        </div>

        {/* Account Health */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="font-bold">صحة الحساب</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">البريد الإلكتروني</span>
              <span className="text-green-500 text-sm">مؤكد</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">حالة الحساب</span>
              <span className="text-green-500 text-sm">نشط</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المخالفات</span>
              <span className="text-green-500 text-sm">لا يوجد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatus;
