
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Post from '@/components/Post';
import WalletCard from '@/components/WalletCard';
import Stories from '@/components/Stories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for stories
  const stories = [
    {
      id: 'own',
      username: 'your_username',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      hasViewed: false,
      isOwn: true
    },
    {
      id: '1',
      username: 'alex_creator',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      hasViewed: false
    },
    {
      id: '2',
      username: 'sarah_artist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      hasViewed: true
    },
    {
      id: '3',
      username: 'mike_photographer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      hasViewed: false
    },
    {
      id: '4',
      username: 'emma_design',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      hasViewed: true
    },
    {
      id: '5',
      username: 'david_travel',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      hasViewed: false
    }
  ];

  const userStats = {
    balance: 47.83,
    todayEarnings: 0.55,
    totalPosts: posts.length
  };

  useEffect(() => {
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

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data?.map((post: any) => ({
        id: post.id,
        username: post.profiles?.username || post.profiles?.full_name || 'مستخدم',
        userAvatar: post.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        image: post.media_url,
        caption: post.content,
        likes: post.likes_count,
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
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            {/* Stories */}
            <Stories stories={stories} />
            
            {/* Wallet Card */}
            <WalletCard {...userStats} />
            
            {/* Posts Feed */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">جاري التحميل...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Post key={post.id} {...post} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">لا توجد منشورات بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
