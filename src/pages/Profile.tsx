import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import UserProfile from '@/components/UserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "سجل دخولك لعرض ملفك الشخصي",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      setUser(authUser);
      await loadProfile(authUser.id);
      await loadPosts(authUser.id);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setProfile({
        ...data,
        following_count: followingCount || 0
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserPosts(data || []);

      // Subscribe to realtime changes
      const channel = supabase
        .channel('user-posts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
            filter: `user_id=eq.${userId}`
          },
          () => {
            loadPosts(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.displayName,
          bio: data.bio
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث ملفك الشخصي بنجاح",
      });

      await loadProfile(user.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث البيانات",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20 pb-8">
          <div className="text-center text-gray-500">
            جاري التحميل...
          </div>
        </main>
      </div>
    );
  }

  const userData = {
    username: profile?.username || user?.user_metadata?.username || 'مستخدم',
    displayName: profile?.full_name || user?.user_metadata?.full_name || 'مستخدم',
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    followers: profile?.followers_count || 0,
    following: profile?.following_count || 0,
    posts: userPosts.length,
    bio: profile?.bio || 'لا يوجد وصف',
    phone: profile?.phone_number || '',
    profileId: user?.id
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            <UserProfile {...userData} onUpdate={handleProfileUpdate} />
            
            {/* Saved Posts Button */}
            <div className="mt-6 sm:mt-8 flex justify-center">
              <Button
                onClick={() => navigate('/saved-posts')}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
              >
                <Bookmark className="w-5 h-5" />
                <span>المنشورات المحفوظة</span>
              </Button>
            </div>
            
            {/* Posts Grid - Responsive */}
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1 lg:gap-2 mt-6 sm:mt-8">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="relative aspect-square group cursor-pointer"
                    onClick={() => navigate('/')}
                  >
                    {post.media_url ? (
                      <img 
                        src={post.media_url} 
                        alt="Post"
                        className="w-full h-full object-cover rounded-sm lg:rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 rounded-sm lg:rounded-md flex items-center justify-center p-4">
                        <p className="text-gray-400 text-sm text-center line-clamp-6">
                          {post.content}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm lg:rounded-md">
                      <div className="flex items-center space-x-3 sm:space-x-4 text-white text-sm sm:text-base lg:text-lg">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                          <span className="font-semibold">{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                          <span className="font-semibold">{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-600 text-xs opacity-50">لا توجد منشورات بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
