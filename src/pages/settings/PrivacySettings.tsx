import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from localStorage for now
      const savedPrivacy = localStorage.getItem('account_private');
      const savedActivity = localStorage.getItem('show_activity');
      
      setIsPrivate(savedPrivacy === 'true');
      setShowActivity(savedActivity !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivateToggle = (value: boolean) => {
    setIsPrivate(value);
    localStorage.setItem('account_private', value.toString());
    toast({
      title: value ? "الحساب خاص الآن" : "الحساب عام الآن",
      description: value 
        ? "فقط المتابعون المعتمدون يمكنهم رؤية منشوراتك" 
        : "يمكن للجميع رؤية منشوراتك",
    });
  };

  const handleActivityToggle = (value: boolean) => {
    setShowActivity(value);
    localStorage.setItem('show_activity', value.toString());
    toast({
      title: "تم حفظ الإعداد",
    });
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
          <h1 className="text-xl font-bold">خصوصية الحساب</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Private Account */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">حساب خاص</p>
                <p className="text-sm text-muted-foreground">
                  عند تفعيل هذا الخيار، سيتطلب متابعتك موافقتك
                </p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={handlePrivateToggle} />
          </div>
        </div>

        {/* Activity Status */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showActivity ? (
                <Eye className="w-5 h-5 text-muted-foreground" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">حالة النشاط</p>
                <p className="text-sm text-muted-foreground">
                  السماح للحسابات التي تتابعها برؤية آخر نشاط لك
                </p>
              </div>
            </div>
            <Switch checked={showActivity} onCheckedChange={handleActivityToggle} />
          </div>
        </div>

        <div className="text-sm text-muted-foreground p-4">
          <p>عند تحويل حسابك إلى خاص:</p>
          <ul className="list-disc mr-4 mt-2 space-y-1">
            <li>سيتم إخفاء منشوراتك عن غير المتابعين</li>
            <li>يجب الموافقة على طلبات المتابعة</li>
            <li>لن تظهر منشوراتك في صفحة الاستكشاف</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
