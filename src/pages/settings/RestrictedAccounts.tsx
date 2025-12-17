import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface RestrictedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

const RestrictedAccounts = () => {
  const navigate = useNavigate();
  const [restrictedUsers, setRestrictedUsers] = useState<RestrictedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestrictedUsers();
  }, []);

  const loadRestrictedUsers = async () => {
    try {
      const saved = localStorage.getItem('restricted_accounts');
      if (saved) {
        setRestrictedUsers(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading restricted users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnrestrict = (userId: string) => {
    const updated = restrictedUsers.filter(u => u.id !== userId);
    setRestrictedUsers(updated);
    localStorage.setItem('restricted_accounts', JSON.stringify(updated));
    toast({
      title: "تم إلغاء التقييد",
      description: "يمكن لهذا الحساب الآن التفاعل معك بشكل طبيعي",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">الحسابات المقيدة</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-card rounded-xl p-4 mb-4">
          <h3 className="font-bold mb-2">ما هو التقييد؟</h3>
          <p className="text-sm text-muted-foreground">
            عند تقييد شخص ما، لن تظهر تعليقاته على منشوراتك إلا له. لن يتم إعلامه بتقييده.
            كما لن يستطيع رؤية متى تكون متصلاً أو إذا قرأت رسائله.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : restrictedUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم تقم بتقييد أي حساب</p>
            <p className="text-sm text-muted-foreground mt-2">
              يمكنك تقييد الحسابات من ملفاتهم الشخصية
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {restrictedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-card rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.full_name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnrestrict(user.id)}
                >
                  إلغاء التقييد
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictedAccounts;
