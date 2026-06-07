import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Post from '@/components/Post';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SavedPosts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك لعرض المنشورات المحفوظة",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    await loadSavedPosts(user.id);
  };

  const loadSavedPosts = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get saved post IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_posts')
        .select('post_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        setSavedPosts([]);
        return;
      }

      const postIds = savedData.map(s => s.post_id);

      // Get posts details
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .in('id', postIds);

      if (postsError) throw postsError;

      setSavedPosts(postsData || []);
    } catch (error: any) {
      console.error('Error loading saved posts:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل المنشورات المحفوظة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-gray-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center space-x-3">
                  <Bookmark className="w-6 h-6 text-yellow-400" />
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    المنشورات المحفوظة
                  </h1>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                {savedPosts.length} منشور
              </p>
            </div>

            {/* Saved Posts */}
            <div className="space-y-4">
              {savedPosts.length > 0 ? (
                savedPosts.map((post) => (
                  <Post
                    key={post.id}
                    id={post.id}
                    userId={post.user_id}
                    username={post.profiles?.username || post.profiles?.full_name || 'مستخدم'}
                    userAvatar={post.profiles?.avatar_url || '/default-avatar.jpg'}
                    image={post.media_url}
                    caption={post.content}
                    likes={post.likes_count || 0}
                    commentsCount={post.comments_count || 0}
                    timeAgo={new Date(post.created_at).toLocaleDateString('ar-EG')}
                    walletEarnings={0}
                    musicTitle={post.music_title}
                    musicArtist={post.music_artist}
                    musicUrl={post.music_url}
                    musicStartTime={(post as any).music_start_time ?? 0}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">لا توجد منشورات محفوظة</p>
                  <p className="text-gray-500 text-sm">
                    احفظ المنشورات المفضلة لديك لمشاهدتها لاحقاً
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SavedPosts;
