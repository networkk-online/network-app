import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Music, Hash, Repeat } from 'lucide-react';

const SavedContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedReels, setSavedReels] = useState<any[]>([]);
  const [savedMusic, setSavedMusic] = useState<any[]>([]);
  const [savedHashtags, setSavedHashtags] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'يجب تسجيل الدخول',
        description: 'سجل دخولك لعرض المحفوظات',
        variant: 'destructive'
      });
      navigate('/login');
      return;
    }
    await loadSavedContent(user.id);
  };

  const loadSavedContent = async (userId: string) => {
    try {
      // Load saved posts
      const { data: postsData } = await supabase
        .from('saved_posts')
        .select(`
          id,
          created_at,
          post:posts(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSavedPosts(postsData || []);

      // Load saved reels
      const { data: reelsData } = await supabase
        .from('saved_reels')
        .select(`
          id,
          created_at,
          reel:reels(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSavedReels(reelsData || []);

      // Load saved music
      const { data: musicData } = await supabase
        .from('saved_music')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSavedMusic(musicData || []);

      // Load saved hashtags
      const { data: hashtagsData } = await supabase
        .from('saved_hashtags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setSavedHashtags(hashtagsData || []);

      // Load reposts
      const { data: repostsData } = await supabase
        .from('reposts')
        .select(`
          id,
          created_at,
          post:posts(*),
          reel:reels(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setReposts(repostsData || []);
    } catch (error: any) {
      console.error('Error loading saved content:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل المحفوظات',
        variant: 'destructive'
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
      
      <main className="pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding">
            <h1 className="text-2xl font-bold text-white mb-6">المحفوظات</h1>

            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-900">
                <TabsTrigger value="posts">المنشورات</TabsTrigger>
                <TabsTrigger value="reels">الريلز</TabsTrigger>
                <TabsTrigger value="music">الأغاني</TabsTrigger>
                <TabsTrigger value="hashtags">الهاشتاق</TabsTrigger>
                <TabsTrigger value="reposts">إعادة النشر</TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                <div className="grid grid-cols-3 gap-1">
                  {savedPosts.length > 0 ? (
                    savedPosts.map((item) => (
                      <div 
                        key={item.id} 
                        className="relative aspect-square group cursor-pointer"
                        onClick={() => navigate('/')}
                      >
                        {item.post?.media_url ? (
                          <img 
                            src={item.post.media_url} 
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4">
                            <p className="text-gray-400 text-sm text-center line-clamp-6">
                              {item.post?.content}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-4 text-white">
                            <span className="flex items-center gap-1">
                              <Heart className="w-5 h-5" fill="white" />
                              {item.post?.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-5 h-5" fill="white" />
                              {item.post?.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 py-12">
                      لا توجد منشورات محفوظة
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reels" className="mt-6">
                <div className="grid grid-cols-3 gap-1">
                  {savedReels.length > 0 ? (
                    savedReels.map((item) => (
                      <div 
                        key={item.id} 
                        className="relative aspect-[9/16] group cursor-pointer"
                        onClick={() => navigate('/shorts')}
                      >
                        <img 
                          src={item.reel?.thumbnail_url || item.reel?.video_url} 
                          alt="Reel"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-4 text-white">
                            <span className="flex items-center gap-1">
                              <Heart className="w-5 h-5" fill="white" />
                              {item.reel?.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-5 h-5" fill="white" />
                              {item.reel?.comments_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 py-12">
                      لا توجد ريلز محفوظة
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="music" className="mt-6">
                <div className="space-y-4">
                  {savedMusic.length > 0 ? (
                    savedMusic.map((music) => (
                      <div key={music.id} className="bg-gray-900 p-4 rounded-lg flex items-center gap-4">
                        <Music className="w-8 h-8 text-primary" />
                        <div className="flex-1">
                          <p className="text-white font-semibold">{music.music_title}</p>
                          {music.music_artist && (
                            <p className="text-gray-400 text-sm">{music.music_artist}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      لا توجد أغاني محفوظة
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="hashtags" className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {savedHashtags.length > 0 ? (
                    savedHashtags.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-800"
                        onClick={() => navigate(`/explore?hashtag=${item.hashtag}`)}
                      >
                        <Hash className="w-4 h-4 text-primary" />
                        <span className="text-white">{item.hashtag}</span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center text-gray-500 py-12">
                      لا توجد هاشتاقات محفوظة
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reposts" className="mt-6">
                <div className="grid grid-cols-3 gap-1">
                  {reposts.length > 0 ? (
                    reposts.map((item) => {
                      const content = item.post || item.reel;
                      const mediaUrl = item.post?.media_url || item.reel?.thumbnail_url || item.reel?.video_url;
                      
                      return (
                        <div 
                          key={item.id} 
                          className="relative aspect-square group cursor-pointer"
                          onClick={() => navigate('/')}
                        >
                          {mediaUrl ? (
                            <img 
                              src={mediaUrl} 
                              alt="Repost"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4">
                              <p className="text-gray-400 text-sm text-center line-clamp-6">
                                {content?.content || content?.caption}
                              </p>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/70 p-1 rounded-full">
                            <Repeat className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center text-gray-500 py-12">
                      لا توجد منشورات معاد نشرها
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SavedContent;
