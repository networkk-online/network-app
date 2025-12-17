import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ban, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const BlockedAccounts = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at
        `)
        .eq('blocker_id', user.id);

      if (error) throw error;

      // Fetch profiles for blocked users
      if (data && data.length > 0) {
        const blockedIds = data.map(b => b.blocked_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', blockedIds);

        const blockedWithProfiles = data.map(blocked => ({
          ...blocked,
          profile: profiles?.find(p => p.id === blocked.blocked_id) || {
            username: 'مستخدم محذوف',
            full_name: '',
            avatar_url: ''
          }
        }));

        setBlockedUsers(blockedWithProfiles);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
      toast({
        title: "تم إلغاء الحظر",
        description: "يمكن لهذا المستخدم الآن التفاعل معك",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الحظر",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">الحسابات المحظورة</h1>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          لن يتمكن الأشخاص المحظورون من العثور على ملفك الشخصي أو منشوراتك أو قصصك. لن يتم إعلامهم بحظرك لهم.
        </p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Ban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم تقم بحظر أي شخص</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-3 bg-card rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={blocked.profile.avatar_url} />
                    <AvatarFallback>
                      {blocked.profile.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{blocked.profile.username}</p>
                    <p className="text-sm text-muted-foreground">{blocked.profile.full_name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(blocked.blocked_id)}
                >
                  إلغاء الحظر
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedAccounts;
