import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface MutedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  muted_stories: boolean;
  muted_posts: boolean;
}

const MutedAccounts = () => {
  const navigate = useNavigate();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMutedUsers();
  }, []);

  const loadMutedUsers = async () => {
    try {
      // Load from localStorage
      const savedMuted = localStorage.getItem('muted_accounts');
      if (savedMuted) {
        setMutedUsers(JSON.parse(savedMuted));
      }
    } catch (error) {
      console.error('Error loading muted users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmute = (userId: string) => {
    const updated = mutedUsers.filter(u => u.id !== userId);
    setMutedUsers(updated);
    localStorage.setItem('muted_accounts', JSON.stringify(updated));
    toast({
      title: "تم إلغاء الكتم",
      description: "ستظهر منشورات وقصص هذا الحساب الآن",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">الحسابات المكتومة</h1>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          الحسابات التي كتمتها لن تظهر منشوراتها أو قصصها في خلاصتك، لكن يمكنك زيارة ملفاتهم الشخصية.
        </p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : mutedUsers.length === 0 ? (
          <div className="text-center py-12">
            <VolumeX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم تقم بكتم أي حساب</p>
            <p className="text-sm text-muted-foreground mt-2">
              عندما تكتم حساباً، لن تظهر منشوراته في خلاصتك
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mutedUsers.map((user) => (
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
                    <p className="text-sm text-muted-foreground">
                      {user.muted_posts && user.muted_stories
                        ? 'المنشورات والقصص'
                        : user.muted_posts
                        ? 'المنشورات فقط'
                        : 'القصص فقط'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnmute(user.id)}
                >
                  إلغاء الكتم
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MutedAccounts;
