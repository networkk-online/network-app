import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Search } from 'lucide-react';
import { FollowButton } from '@/components/FollowButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface Follower {
  id: string;
  follower_id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const Followers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileId = location.state?.profileId;
  const username = location.state?.username;

  const filteredFollowers = useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const query = searchQuery.toLowerCase();
    return followers.filter(follower => 
      follower.profiles.username?.toLowerCase().includes(query) ||
      follower.profiles.full_name?.toLowerCase().includes(query)
    );
  }, [followers, searchQuery]);

  useEffect(() => {
    loadFollowers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadFollowers = async () => {
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
        .select('id, follower_id')
        .eq('following_id', profileId);

      if (error) throw error;

      if (followsData && followsData.length > 0) {
        const followerIds = followsData.map(f => f.follower_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followerIds);

        if (profilesError) throw profilesError;

        const mappedFollowers = followsData.map(follow => ({
          id: follow.id,
          follower_id: follow.follower_id,
          profiles: profilesData?.find(p => p.id === follow.follower_id) || {
            id: follow.follower_id,
            username: '',
            full_name: '',
            avatar_url: ''
          }
        }));

        setFollowers(mappedFollowers);
      }
    } catch (error: any) {
      console.error('Error loading followers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل المتابعين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();

      if (existingFollow) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-center space-x-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full">
              <ArrowRight className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">المتابعون - {username}</h1>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-gray-900/50 border-gray-700"
            />
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">جاري التحميل...</div>
          ) : filteredFollowers.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              {searchQuery ? 'لا توجد نتائج' : 'لا يوجد متابعون'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFollowers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={follower.profiles.avatar_url || undefined}
                        alt={follower.profiles.username || ''}
                      />
                      <AvatarFallback>
                        {follower.profiles.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{follower.profiles.username}</p>
                      {follower.profiles.full_name && (
                        <p className="text-sm text-gray-400">{follower.profiles.full_name}</p>
                      )}
                    </div>
                  </div>
                  {currentUserId !== follower.follower_id && (
                    <FollowButton 
                      userId={follower.follower_id} 
                      size="sm"
                      variant="secondary"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Followers;
