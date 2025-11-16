import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Following {
  id: string;
  following_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const Following = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const profileId = location.state?.profileId;
  const username = location.state?.username;

  useEffect(() => {
    loadFollowing();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadFollowing = async () => {
    if (!profileId) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المستخدم",
        variant: "destructive"
      });
      navigate('/profile');
      return;
    }

    try {
      const { data: followsData, error } = await supabase
        .from('follows')
        .select('id, following_id')
        .eq('follower_id', profileId);

      if (error) throw error;

      if (followsData && followsData.length > 0) {
        const followingIds = followsData.map(f => f.following_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds);

        if (profilesError) throw profilesError;

        const mappedFollowing = followsData.map(follow => ({
          id: follow.id,
          following_id: follow.following_id,
          profiles: profilesData?.find(p => p.id === follow.following_id) || {
            id: follow.following_id,
            username: '',
            full_name: '',
            avatar_url: ''
          }
        }));

        setFollowing(mappedFollowing);
      }
    } catch (error: any) {
      console.error('Error loading following:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل المتابعة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);

      setFollowing(prev => prev.filter(f => f.following_id !== userId));
      
      toast({
        title: "تم إلغاء المتابعة",
        description: "تم إلغاء المتابعة بنجاح",
      });
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء المتابعة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">يتابع - {username}</h1>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">جاري التحميل...</div>
          ) : following.length === 0 ? (
            <div className="text-center text-gray-500 py-12">لا يتابع أحد</div>
          ) : (
            <div className="space-y-4">
              {following.map((follow) => (
                <div key={follow.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={follow.profiles.avatar_url || undefined}
                        alt={follow.profiles.username || ''}
                      />
                      <AvatarFallback>
                        {follow.profiles.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{follow.profiles.username}</p>
                      {follow.profiles.full_name && (
                        <p className="text-sm text-gray-400">{follow.profiles.full_name}</p>
                      )}
                    </div>
                  </div>
                  <FollowButton 
                    userId={follow.following_id} 
                    size="sm"
                    variant="secondary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Following;
