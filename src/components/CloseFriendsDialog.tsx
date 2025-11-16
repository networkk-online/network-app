import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface CloseFriend {
  id: string;
  friend_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export const CloseFriendsDialog = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [closeFriends, setCloseFriends] = useState<CloseFriend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadCloseFriends();
    }
  }, [open]);

  const loadCloseFriends = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: closeFriendsData, error: closeFriendsError } = await supabase
        .from('close_friends')
        .select('id, friend_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (closeFriendsError) throw closeFriendsError;

      if (!closeFriendsData || closeFriendsData.length === 0) {
        setCloseFriends([]);
        return;
      }

      // Get profiles for all friends
      const friendIds = closeFriendsData.map(cf => cf.friend_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Combine data
      const combinedData = closeFriendsData.map(cf => {
        const profile = profilesData?.find(p => p.id === cf.friend_id);
        return {
          id: cf.id,
          friend_id: cf.friend_id,
          profiles: profile || {
            id: cf.friend_id,
            username: 'user',
            full_name: 'مستخدم',
            avatar_url: ''
          }
        };
      });

      setCloseFriends(combinedData);
    } catch (error: any) {
      console.error('Error loading close friends:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل قائمة الأصدقاء المقربين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCloseFriend = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('close_friends')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', friendId);

      if (error) throw error;

      toast({
        title: 'تمت الإزالة',
        description: 'تم إزالة المستخدم من قائمة الأصدقاء المقربين',
      });

      await loadCloseFriends();
    } catch (error: any) {
      console.error('Error removing close friend:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الإزالة',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Star className="h-4 w-4" />
          الأصدقاء المقربين
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>قائمة الأصدقاء المقربين</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : closeFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا يوجد أصدقاء مقربين بعد</p>
              <p className="text-sm mt-1">قم بإضافة أصدقائك المقربين لمشاركة محتوى خاص معهم</p>
            </div>
          ) : (
            closeFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    navigate(`/profile/${friend.friend_id}`);
                    setOpen(false);
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.profiles.avatar_url} />
                    <AvatarFallback>
                      {friend.profiles.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{friend.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{friend.profiles.username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCloseFriend(friend.friend_id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
