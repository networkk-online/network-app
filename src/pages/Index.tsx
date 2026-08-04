import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Post from '@/components/Post';
import FloatingWheelIcon from '@/components/FloatingWheelIcon';
import StoryCircle from '@/components/StoryCircle';
import StoryViewer from '@/components/StoryViewer';
import Advertisement from '@/components/Advertisement';
import FeedReelCard from '@/components/FeedReelCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';
import { useReels } from '@/hooks/useReels';
import { usePostSize } from '@/hooks/usePostSize';
import LocalFameRankSection from '@/components/LocalFameRankSection';

import { PostSkeleton, StoriesRowSkeleton } from '@/components/skeletons';
import { Film, Feather } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { hasCachedSession } from '@/lib/authBoot';


const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewingStories, setViewingStories] = useState<any[]>([]);
  const [viewingStoriesUserId, setViewingStoriesUserId] = useState<string>('');
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  
  const { stories, loading: storiesLoading, markUserStoriesAsViewed, markStoryAsViewed } = useStories(userId);
  const { size: postSize, setSize: setPostSize } = usePostSize();
  const { reels: feedReels, loading: reelsLoading, likedReels, toggleLike } = useReels(userId, true);

  useEffect(() => {
    // Instant, network-free auth routing — no blank screen while we wait.
    if (!hasCachedSession()) {
      navigate('/login', { replace: true });
      return;
    }

    // Check if first time user
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      navigate('/welcome', { replace: true });
      return;
    }

    getCurrentUser();
    loadPosts();
    loadFeaturedPosts();

    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const getCurrentUser = async () => {
    // getSession() reads the cached session locally (no network round-trip).
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
    }
  };

  const handleStoryClick = (userStories: any[], storyUserId: string) => {
    setViewingStories(userStories);
    setViewingStoriesUserId(storyUserId);
    setCurrentStoryIndex(0);
    setShowStoryViewer(true);
  };

  const handleStoryViewed = (storyId: string, storyUserId: string) => {
    markStoryAsViewed(storyId, storyUserId);
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
    // Mark stories as viewed when closing
    if (viewingStoriesUserId) {
      markUserStoriesAsViewed(viewingStoriesUserId);
    }
  };

  const handleCreateStory = () => {
    navigate('/create-story');
  };

  const loadPosts = async () => {
    try {
      // Get posts first
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Get profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const formattedPosts = postsData.map((post: any) => {
        const profile = profilesData?.find(p => p.id === post.user_id);
        return {
          id: post.id,
          userId: post.user_id,
          username: profile?.username || profile?.full_name || 'مستخدم',
          userAvatar: profile?.avatar_url || '/default-avatar.jpg',
          isVerified: profile?.is_verified || false,
          image: post.media_url,
          caption: post.content,
          likes: post.likes_count || 0,
          commentsCount: post.comments_count || 0,
          timeAgo: getTimeAgo(post.created_at),
          walletEarnings: 0,
          musicTitle: post.music_title,
          musicArtist: post.music_artist,
          musicUrl: post.music_url,
          musicStartTime: (post as any).music_start_time ?? 0,
        };
      });

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل المنشورات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedPosts = data.map((post: any) => ({
          id: post.id,
          userId: 'featured',
          username: post.author_name,
          userAvatar: post.author_avatar || '/default-avatar.jpg',
          isVerified: false,
          image: post.media_url,
          caption: post.content,
          likes: post.likes_count || 0,
          commentsCount: post.comments_count || 0,
          timeAgo: getTimeAgo(post.created_at),
          walletEarnings: 0,
          isFeatured: true
        }));
        setFeaturedPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error loading featured posts:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} د`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} س`;
    return `${Math.floor(seconds / 86400)} ي`;
  };


  return (
    <div className="min-h-screen">
      <SeoHead route="/" />
      <Header postSize={postSize} onPostSizeChange={setPostSize} />
      <FloatingWheelIcon />
      
      <main className="pt-16 sm:pt-20 pb-24">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            {/* Stories */}
            <div className="border-b border-white/[0.04] pb-4 mb-6">
              {storiesLoading ? (
                <StoriesRowSkeleton count={6} />
              ) : (
                <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                  {/* Own story */}
                  {userProfile && (
                    <StoryCircle
                      username={userProfile.username || 'أنت'}
                      avatar={userProfile.avatar_url || '/default-avatar.jpg'}
                      hasStory={stories[userId]?.stories.length > 0}
                      isOwn={true}
                      hasViewed={stories[userId]?.hasViewed || false}
                      onClick={() => {
                        if (stories[userId]?.stories.length > 0) {
                          handleStoryClick(stories[userId].stories, userId);
                        } else {
                          handleCreateStory();
                        }
                      }}
                      onCameraClick={handleCreateStory}
                    />
                  )}
                  
                  {/* Other users' stories */}
                  {Object.values(stories).map((userStory: any) => {
                    if (userStory.user.id === userId) return null;
                    
                    return (
                      <StoryCircle
                        key={userStory.user.id}
                        username={userStory.user.username}
                        avatar={userStory.user.avatar_url}
                        hasStory={true}
                        hasViewed={userStory.hasViewed}
                        onClick={() => handleStoryClick(userStory.stories, userStory.user.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>


            {/* Tweets Section Link */}
            <div className="mb-6">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/tweets')}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.06] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Feather className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-foreground font-semibold text-sm">التغريدات</h3>
                    <p className="text-muted-foreground text-xs">شارك أفكارك مع الجميع</p>
                  </div>
                </div>
                <span className="text-primary text-sm group-hover:translate-x-[-4px] transition-transform">←</span>
              </motion.button>
            </div>

            {/* Feed Reels Section */}
            {!reelsLoading && feedReels.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    <h2 className="text-white/90 font-semibold text-sm tracking-wide">ريلز</h2>
                  </div>
                  <button 
                    onClick={() => navigate('/shorts')}
                    className="text-primary text-sm"
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {feedReels.slice(0, 8).map((reel) => (
                    <FeedReelCard
                      key={reel.id}
                      id={reel.id}
                      videoUrl={reel.video_url}
                      thumbnailUrl={reel.thumbnail_url}
                      caption={reel.caption}
                      likesCount={reel.likes_count}
                      commentsCount={reel.comments_count}
                      username={reel.profiles?.username || 'مستخدم'}
                      userAvatar={reel.profiles?.avatar_url || '/default-avatar.jpg'}
                      isLiked={likedReels.includes(reel.id)}
                      onDoubleTapLike={toggleLike}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Posts Feed */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {loading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <div key={post.id}>
                    <Post {...post} displaySize={postSize} />
                    {(index + 1) % 3 === 0 && <Advertisement placement="feed" className="mt-4" />}
                  </div>
                ))
              ) : featuredPosts.length > 0 ? (
                <>
                  <div className="text-center py-4 mb-4">
                    <p className="text-primary text-sm font-medium">✨ محتوى مقترح لك</p>
                    <p className="text-muted-foreground text-xs">تابع أشخاص لرؤية منشوراتهم هنا</p>
                  </div>
                  {featuredPosts.map((post, index) => (
                    <div key={post.id}>
                      <Post {...post} displaySize={postSize} />
                      {(index + 1) % 3 === 0 && <Advertisement placement="feed" className="mt-4" />}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">لا توجد منشورات بعد</p>
                </div>
              )}
            </div>

            {/* Local Fame Rank Section */}
            <div className="mt-6">
              <LocalFameRankSection />
            </div>
          </div>
        </div>
      </main>

      {/* Story Viewer */}
      {showStoryViewer && viewingStories.length > 0 && (
        <StoryViewer
          stories={viewingStories}
          currentIndex={currentStoryIndex}
          onClose={handleCloseStoryViewer}
          onNext={() => setCurrentStoryIndex(prev => Math.min(prev + 1, viewingStories.length - 1))}
          onPrev={() => setCurrentStoryIndex(prev => Math.max(prev - 1, 0))}
          onStoryViewed={handleStoryViewed}
        />
      )}
    </div>
  );
};

export default Index;
