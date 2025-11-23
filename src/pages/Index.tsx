
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Post from '@/components/Post';
import StoryCircle from '@/components/StoryCircle';
import StoryViewer from '@/components/StoryViewer';
import Advertisement from '@/components/Advertisement';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';
import LocalFameRankSection from '@/components/LocalFameRankSection';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewingStories, setViewingStories] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  
  const { stories, loading: storiesLoading } = useStories(userId);

  useEffect(() => {
    getCurrentUser();
    loadPosts();
    
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
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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

  const handleStoryClick = (userStories: any[]) => {
    setViewingStories(userStories);
    setCurrentStoryIndex(0);
    setShowStoryViewer(true);
  };

  const handleCreateStory = () => {
    navigate('/create-story');
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        username: post.profiles?.username || post.profiles?.full_name || 'مستخدم',
        userAvatar: post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        image: post.media_url,
        caption: post.content,
        likes: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        timeAgo: getTimeAgo(post.created_at),
        walletEarnings: 0
      })) || [];

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
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-24">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            {/* Stories */}
            <div className="border-b border-gray-800 pb-4 mb-6">
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {/* Own story */}
                {userProfile && (
                  <StoryCircle
                    username={userProfile.username || 'أنت'}
                    avatar={userProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                    hasStory={stories[userId]?.stories.length > 0}
                    isOwn={true}
                    onClick={() => {
                      if (stories[userId]?.stories.length > 0) {
                        handleStoryClick(stories[userId].stories);
                      } else {
                        handleCreateStory();
                      }
                    }}
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
                      onClick={() => handleStoryClick(userStory.stories)}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Posts Feed */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">جاري التحميل...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <div key={post.id}>
                    <Post {...post} />
                    {(index + 1) % 3 === 0 && <Advertisement placement="feed" className="mt-4" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">لا توجد منشورات بعد</p>
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
          onClose={() => setShowStoryViewer(false)}
          onNext={() => setCurrentStoryIndex(prev => Math.min(prev + 1, viewingStories.length - 1))}
          onPrev={() => setCurrentStoryIndex(prev => Math.max(prev - 1, 0))}
        />
      )}
    </div>
  );
};

export default Index;
