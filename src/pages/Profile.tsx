import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import UserProfile from '@/components/UserProfile';
import WalletCard from '@/components/WalletCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Bookmark, Wallet, Plus, Play, Eye, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HighlightCircle } from '@/components/HighlightCircle';
import { CreateHighlightDialog } from '@/components/CreateHighlightDialog';
import { HighlightViewer } from '@/components/HighlightViewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStories } from '@/hooks/useStories';
import StoryCircle from '@/components/StoryCircle';
import StoryViewer from '@/components/StoryViewer';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId: urlUserId } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [repostedPosts, setRepostedPosts] = useState<any[]>([]);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'stats' | 'wallet'>('posts');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [showHighlightViewer, setShowHighlightViewer] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [viewingStories, setViewingStories] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, [urlUserId]);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        if (!urlUserId) {
          toast({
            title: "يجب تسجيل الدخول",
            description: "سجل دخولك لعرض ملفك الشخصي",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
      }

      setUser(authUser);
      const targetUserId = urlUserId || authUser?.id;
      const isOwn = authUser?.id === targetUserId;
      setIsOwnProfile(isOwn);
      
      if (targetUserId) {
        await loadProfile(targetUserId, isOwn);
        await loadPosts(targetUserId);
        await loadReels(targetUserId);
        await loadHighlights(targetUserId);
        await loadReposts(targetUserId);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadProfile = async (userId: string, isOwn: boolean) => {
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

      // Load wallet data only for own profile
      if (isOwn) {
        await loadWalletData(userId);
      }
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

  const loadWalletData = async (userId: string) => {
    try {
      // Get or create user finances
      let { data: financeData, error: financeError } = await supabase
        .from('user_finances')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // If no finance record exists, create one with zero balance
      if (!financeData && !financeError) {
        const { data: newFinance, error: insertError } = await supabase
          .from('user_finances')
          .insert({
            user_id: userId,
            balance: 0,
            total_earnings: 0,
            total_withdrawn: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating finance record:', insertError);
        } else {
          financeData = newFinance;
        }
      }

      if (financeError && financeError.code !== 'PGRST116') {
        throw financeError;
      }

      // Set wallet balance from database or 0
      setWalletBalance(financeData ? Number(financeData.balance) || 0 : 0);

      // Calculate today's earnings from transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'earning')
        .eq('status', 'completed')
        .gte('created_at', today.toISOString());

      if (transactionsError && transactionsError.code !== 'PGRST116') {
        throw transactionsError;
      }

      const todayTotal = todayTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setTodayEarnings(todayTotal);

      // Subscribe to realtime updates for finances
      const financeChannel = supabase
        .channel('user-finances-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_finances',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.new && typeof payload.new === 'object' && 'balance' in payload.new) {
              setWalletBalance(Number(payload.new.balance) || 0);
            }
          }
        )
        .subscribe();

      // Subscribe to realtime updates for transactions
      const transactionsChannel = supabase
        .channel('user-transactions-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`
          },
          () => {
            // Reload wallet data when new transaction is added
            loadWalletData(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(financeChannel);
        supabase.removeChannel(transactionsChannel);
      };
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setWalletBalance(0);
      setTodayEarnings(0);
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

  const loadReels = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReels(data || []);

      // Subscribe to realtime changes
      const channel = supabase
        .channel('user-reels-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reels',
            filter: `user_id=eq.${userId}`
          },
          () => {
            loadReels(userId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  };

  const loadHighlights = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const loadReposts = async (userId: string) => {
    try {
      // Get reposts by user
      const { data: repostsData, error: repostsError } = await supabase
        .from('reposts')
        .select('post_id')
        .eq('user_id', userId)
        .not('post_id', 'is', null);

      if (repostsError) throw repostsError;
      
      if (!repostsData || repostsData.length === 0) {
        setRepostedPosts([]);
        return;
      }

      // Get the actual posts
      const postIds = repostsData.map(r => r.post_id).filter(Boolean);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', postIds);

      if (postsError) throw postsError;

      // Get profiles for these posts
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', userIds);

      const formattedPosts = (postsData || []).map(post => ({
        ...post,
        isRepost: true,
        originalAuthor: profiles?.find(p => p.id === post.user_id)
      }));

      setRepostedPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading reposts:', error);
    }
  };

  const handleHighlightClick = (highlightId: string) => {
    setSelectedHighlightId(highlightId);
    setShowHighlightViewer(true);
  };

  const handleProfileUpdate = async (data: any) => {
    if (!user) return;

    try {
      const updateData: any = {};
      
      if (data.username) updateData.username = data.username;
      if (data.displayName) updateData.full_name = data.displayName;
      if (data.bio) updateData.bio = data.bio;
      if (data.avatar_url) updateData.avatar_url = data.avatar_url;
      if (data.cover_url !== undefined) updateData.cover_url = data.cover_url;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.school !== undefined) updateData.school = data.school;
      if (data.profession !== undefined) updateData.profession = data.profession;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.birthDate !== undefined) updateData.birth_date = data.birthDate;
      if (data.website !== undefined) updateData.website = data.website;
      
      // Build social links object
      const socialLinks: any = {};
      if (data.instagram) socialLinks.instagram = data.instagram;
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.tiktok) socialLinks.tiktok = data.tiktok;
      if (data.youtube) socialLinks.youtube = data.youtube;
      if (data.snapchat) socialLinks.snapchat = data.snapchat;
      
      if (Object.keys(socialLinks).length > 0 || data.instagram === '' || data.twitter === '' || data.tiktok === '' || data.youtube === '' || data.snapchat === '') {
        updateData.social_links = socialLinks;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث ملفك الشخصي بنجاح",
      });

      await loadProfile(user.id, true);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث البيانات",
        variant: "destructive"
      });
    }
  };

  // Get stories for profile user
  const targetUserId = urlUserId || user?.id;
  const { stories, markStoryAsViewed } = useStories(user?.id);
  const profileStories = targetUserId && stories[targetUserId] ? stories[targetUserId].stories : [];

  const handleStoryClick = () => {
    if (profileStories.length > 0) {
      setViewingStories(profileStories);
      setCurrentStoryIndex(0);
      setShowStoryViewer(true);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-black/40">
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
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || '/default-avatar.jpg',
    followers: profile?.followers_count || 0,
    following: profile?.following_count || 0,
    posts: userPosts.length,
    bio: profile?.bio || 'لا يوجد وصف',
    phone: profile?.phone_number || '',
    profileId: urlUserId || user?.id
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-28">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            <UserProfile 
              {...userData} 
              onUpdate={handleProfileUpdate}
              coverImage={profile?.cover_url}
              joinedDate={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' }) : undefined}
              location={profile?.location}
              school={profile?.school}
              profession={profile?.profession}
              gender={profile?.gender}
              isVerified={profile?.is_verified || false}
              isOwnProfile={isOwnProfile}
              website={profile?.website}
              socialLinks={profile?.social_links as any}
            />
            
            {/* Story and Highlights Section */}
            {(highlights.length > 0 || isOwnProfile || profileStories.length > 0) && (
              <div className="mt-6 px-4">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-4 pb-2">
                    {/* User's Story Circle - Always show for own profile or if has stories */}
                    {(profileStories.length > 0 || isOwnProfile) && (
                      <div className="flex-shrink-0">
                        <StoryCircle
                          username={isOwnProfile ? 'قصتك' : profile?.username || 'قصة'}
                          avatar={profile?.avatar_url || '/default-avatar.jpg'}
                          hasStory={profileStories.length > 0}
                          hasViewed={targetUserId && stories[targetUserId] ? stories[targetUserId].hasViewed : false}
                          isOwn={isOwnProfile}
                          onClick={() => {
                            if (profileStories.length > 0) {
                              handleStoryClick();
                            } else if (isOwnProfile) {
                              navigate('/create-story');
                            }
                          }}
                          onCameraClick={() => navigate('/create-story')}
                        />
                      </div>
                    )}
                    
                    {/* Create Highlight Button */}
                    {isOwnProfile && (
                      <div 
                        className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
                        onClick={() => setShowCreateHighlight(true)}
                      >
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center hover:border-primary transition-colors">
                          <Plus className="w-6 h-6 text-gray-600" />
                        </div>
                        <span className="text-xs text-center text-gray-400">جديد</span>
                      </div>
                    )}
                    
                    {highlights.map((highlight) => (
                      <div key={highlight.id} className="flex-shrink-0">
                        <HighlightCircle
                          title={highlight.title}
                          coverImage={highlight.cover_image}
                          onClick={() => handleHighlightClick(highlight.id)}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {/* Tabs Navigation */}
            <div className="mt-6 sm:mt-8 flex gap-2 border-b border-gray-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 min-w-[80px] py-3 text-center font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'posts'
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                المنشورات
                {activeTab === 'posts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('reels')}
                className={`flex-1 min-w-[80px] py-3 text-center font-semibold transition-colors relative whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === 'reels'
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Play className="w-4 h-4" />
                الريلز
                {activeTab === 'reels' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 min-w-[80px] py-3 text-center font-semibold transition-colors relative whitespace-nowrap ${
                      activeTab === 'saved'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    المحفوظات
                    {activeTab === 'saved' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 min-w-[80px] py-3 text-center font-semibold transition-colors relative whitespace-nowrap ${
                      activeTab === 'stats'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    الإحصائيات
                    {activeTab === 'stats' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 min-w-[80px] py-3 text-center font-semibold transition-colors relative flex items-center justify-center gap-2 whitespace-nowrap ${
                      activeTab === 'wallet'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    أموالي
                    {activeTab === 'wallet' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Saved Content Tab */}
            {activeTab === 'saved' && isOwnProfile && (
              <div className="mt-6 sm:mt-8">
                <div className="text-center">
                  <Button
                    onClick={() => navigate('/saved-content')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Bookmark className="w-4 h-4 ml-2" />
                    عرض جميع المحفوظات
                  </Button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && isOwnProfile && (
              <div className="mt-6 sm:mt-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">إجمالي المنشورات</p>
                    <p className="text-2xl font-bold text-white">{userPosts.length}</p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">إجمالي الإعجابات</p>
                    <p className="text-2xl font-bold text-white">
                      {userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">إجمالي التعليقات</p>
                    <p className="text-2xl font-bold text-white">
                      {userPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">معدل التفاعل</p>
                    <p className="text-2xl font-bold text-white">
                      {userPosts.length > 0
                        ? Math.round(
                            (userPosts.reduce((sum, post) => sum + (post.likes_count || 0) + (post.comments_count || 0), 0) /
                              userPosts.length)
                          )
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Tab Content */}
            {activeTab === 'wallet' && isOwnProfile && (
              <div className="mt-6 sm:mt-8">
                <WalletCard 
                  balance={walletBalance}
                  todayEarnings={todayEarnings}
                  totalPosts={userPosts.length}
                />
                
                {/* Wallet Actions */}
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => navigate('/withdraw')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>سحب الأرباح</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Posts Grid - Responsive */}
            {activeTab === 'posts' && (
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1 lg:gap-2 mt-6 sm:mt-8">
                {[...userPosts, ...repostedPosts].length > 0 ? (
                  [...userPosts, ...repostedPosts]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((post) => (
                    <div 
                      key={post.id} 
                      className="relative aspect-square group cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
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
                      {/* Repost indicator */}
                      {post.isRepost && (
                        <div className="absolute top-2 left-2 bg-green-500/80 backdrop-blur-sm rounded-full p-1.5">
                          <Repeat2 className="w-3 h-3 text-white" />
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
            )}

            {/* Reels Grid - Responsive */}
            {activeTab === 'reels' && (
              <div className="grid grid-cols-3 gap-0.5 sm:gap-1 lg:gap-2 mt-6 sm:mt-8">
                {userReels.length > 0 ? (
                  userReels.map((reel) => (
                    <div 
                      key={reel.id} 
                      className="relative aspect-[9/16] group cursor-pointer"
                      onClick={() => navigate(`/shorts?reelId=${reel.id}`)}
                    >
                      {reel.thumbnail_url ? (
                        <img 
                          src={reel.thumbnail_url} 
                          alt="Reel"
                          className="w-full h-full object-cover rounded-sm lg:rounded-md"
                        />
                      ) : (
                        <video
                          src={reel.video_url}
                          className="w-full h-full object-cover rounded-sm lg:rounded-md"
                          muted
                        />
                      )}
                      {/* Play Icon - Top of thumbnail */}
                      <div className="absolute top-2 left-2">
                        <Play className="w-4 h-4 text-white/90 fill-white/90 drop-shadow-lg" />
                      </div>
                      {/* Views Count */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs">
                        <Eye className="w-3 h-3" />
                        <span>{reel.views_count || 0}</span>
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm lg:rounded-md">
                        <div className="flex items-center space-x-3 sm:space-x-4 text-white text-sm sm:text-base lg:text-lg">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                            <span className="font-semibold">{reel.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                            <span className="font-semibold">{reel.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-600 text-xs opacity-50">لا توجد ريلز بعد</p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-reel')}
                        className="mt-4 bg-primary hover:bg-primary/90"
                      >
                        <Play className="w-4 h-4 ml-2" />
                        إنشاء ريل جديد
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Highlight Dialog */}
      {isOwnProfile && (
        <CreateHighlightDialog
          open={showCreateHighlight}
          onOpenChange={setShowCreateHighlight}
          userId={user?.id}
          onSuccess={() => {
            loadHighlights(user?.id);
          }}
        />
      )}

      {/* Highlight Viewer */}
      {selectedHighlightId && (
        <HighlightViewer
          open={showHighlightViewer}
          onOpenChange={setShowHighlightViewer}
          highlightId={selectedHighlightId}
        />
      )}

      {/* Story Viewer */}
      {showStoryViewer && viewingStories.length > 0 && (
        <StoryViewer
          stories={viewingStories}
          currentIndex={currentStoryIndex}
          onClose={() => setShowStoryViewer(false)}
          onNext={() => setCurrentStoryIndex(prev => Math.min(prev + 1, viewingStories.length - 1))}
          onPrev={() => setCurrentStoryIndex(prev => Math.max(prev - 1, 0))}
          onStoryViewed={(storyId, storyUserId) => markStoryAsViewed(storyId, storyUserId)}
        />
      )}
    </div>
  );
};

export default Profile;
