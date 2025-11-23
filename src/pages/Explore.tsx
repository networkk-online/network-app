import React, { useState, useEffect } from 'react';
import { Play, Heart, MessageCircle, Bookmark, MoreHorizontal, User, Search as SearchIcon, TrendingUp, Clock, Image, Film } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SearchProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  followers_count: number;
}

interface SearchPost {
  id: string;
  content: string;
  media_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface SearchReel {
  id: string;
  caption: string;
  video_url: string;
  thumbnail_url: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

const Explore = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'date'>('popularity');
  const [users, setUsers] = useState<SearchProfile[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [reels, setReels] = useState<SearchReel[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsers([]);
      setPosts([]);
      setReels([]);
    }
  }, [searchQuery, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .order(sortBy === 'popularity' ? 'followers_count' : 'created_at', { ascending: false })
        .limit(20);

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const postsQuery = supabase
        .from('posts')
        .select('id, content, media_url, likes_count, comments_count, created_at, user_id')
        .ilike('content', `%${searchQuery}%`)
        .limit(20);

      if (sortBy === 'popularity') {
        postsQuery.order('likes_count', { ascending: false });
      } else {
        postsQuery.order('created_at', { ascending: false });
      }

      const { data: postsData, error: postsError } = await postsQuery;
      if (postsError) throw postsError;

      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', post.user_id)
            .single();
          
          return {
            ...post,
            profiles: profileData || { username: 'unknown', avatar_url: '' }
          };
        })
      );
      
      setPosts(postsWithProfiles);

      const reelsQuery = supabase
        .from('reels')
        .select('id, caption, video_url, thumbnail_url, likes_count, views_count, created_at, user_id')
        .ilike('caption', `%${searchQuery}%`)
        .limit(20);

      if (sortBy === 'popularity') {
        reelsQuery.order('views_count', { ascending: false });
      } else {
        reelsQuery.order('created_at', { ascending: false });
      }

      const { data: reelsData, error: reelsError } = await reelsQuery;
      if (reelsError) throw reelsError;

      const reelsWithProfiles = await Promise.all(
        (reelsData || []).map(async (reel) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', reel.user_id)
            .single();
          
          return {
            ...reel,
            profiles: profileData || { username: 'unknown', avatar_url: '' }
          };
        })
      );
      
      setReels(reelsWithProfiles);
    } catch (error: any) {
      console.error('Error searching:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء البحث',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  // محتوى متنوع من البوستات والريلز
  const exploreContent = [
    {
      id: '1',
      type: 'reel',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=600&fit=crop',
      title: 'من تصبير محاص بالغش',
      views: '2.1M',
      duration: '0:45',
      username: 'sarah_content'
    },
    {
      id: '2',
      type: 'post',
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      title: 'أرقام إيرادية',
      likes: '890K',
      username: 'business_tips'
    },
    {
      id: '3',
      type: 'reel',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=600&fit=crop',
      title: 'الأخرى العلاقات المستحيلة',
      views: '1.5M',
      duration: '2:15',
      username: 'lifestyle_guru'
    },
    {
      id: '4',
      type: 'post',
      thumbnail: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
      title: 'وصفة اليوم: كيك الشوكولاتة',
      likes: '3.2K',
      username: 'chef_amira'
    },
    {
      id: '5',
      type: 'reel',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      title: 'عطر لجنس فقط',
      views: '756K',
      duration: '1:05',
      username: 'perfume_expert'
    },
    {
      id: '6',
      type: 'post',
      thumbnail: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop',
      title: 'منظر طبيعي رائع',
      likes: '2.8K',
      username: 'nature_lover'
    },
    {
      id: '7',
      type: 'reel',
      thumbnail: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=600&fit=crop',
      title: 'محتوى حصري',
      views: '1.2M',
      duration: '0:33',
      username: 'exclusive_content'
    },
    {
      id: '8',
      type: 'post',
      thumbnail: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
      title: 'تصميم جرافيكي جديد',
      likes: '945',
      username: 'designer_pro'
    },
    {
      id: '9',
      type: 'reel',
      thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop',
      title: 'لحظات مضحكة',
      views: '1.8M',
      duration: '1:15',
      username: 'funny_moments'
    }
  ];

  const UserCard = ({ user }: { user: SearchProfile }) => (
    <div 
      className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      <div className="flex items-center space-x-3 space-x-reverse">
        <Avatar className="w-12 h-12">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-white font-semibold">{user.full_name || user.username}</h3>
          <p className="text-gray-400 text-sm">@{user.username}</p>
          {user.bio && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-1">{user.bio}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-gray-400 text-sm">{user.followers_count || 0} متابع</p>
      </div>
    </div>
  );

  const PostCard = ({ post }: { post: SearchPost }) => (
    <div 
      className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => navigate('/')}
    >
      {post.media_url ? (
        <img 
          src={post.media_url} 
          alt="Post" 
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center p-4">
          <p className="text-gray-400 text-center line-clamp-6">{post.content}</p>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 space-x-reverse mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-400 text-sm">@{post.profiles?.username}</span>
        </div>
        <p className="text-white text-sm line-clamp-2 mb-2">{post.content}</p>
        <div className="flex items-center space-x-4 space-x-reverse text-gray-400 text-sm">
          <span>❤️ {post.likes_count || 0}</span>
          <span>💬 {post.comments_count || 0}</span>
        </div>
      </div>
    </div>
  );

  const ReelCard = ({ reel }: { reel: SearchReel }) => (
    <div 
      className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={() => navigate('/shorts')}
    >
      <div className="relative aspect-[9/16]">
        <img 
          src={reel.thumbnail_url || reel.video_url} 
          alt="Reel" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <Film className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white opacity-70" />
      </div>
      <div className="p-4">
        <div className="flex items-center space-x-2 space-x-reverse mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={reel.profiles?.avatar_url} />
            <AvatarFallback>
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-400 text-sm">@{reel.profiles?.username}</span>
        </div>
        {reel.caption && (
          <p className="text-white text-sm line-clamp-2 mb-2">{reel.caption}</p>
        )}
        <div className="flex items-center space-x-4 space-x-reverse text-gray-400 text-sm">
          <span>❤️ {reel.likes_count || 0}</span>
          <span>👁️ {reel.views_count || 0}</span>
        </div>
      </div>
    </div>
  );

  const ExploreCard = ({ content }: { content: any }) => (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900">
      <div className={`relative ${content.type === 'reel' ? 'aspect-[4/5]' : 'aspect-square'}`}>
        <img 
          src={content.thumbnail} 
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* تأثير التدرج */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* أيقونة التشغيل للريلز */}
        {content.type === 'reel' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
        
        {/* مدة الفيديو للريلز */}
        {content.type === 'reel' && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {content.duration}
          </div>
        )}
        
        {/* إجراءات سريعة */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* معلومات المحتوى */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-white">
        <div className="flex items-center space-x-2 mb-1">
          <User className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-gray-300">{content.username}</span>
        </div>
        <h3 className="text-xs sm:text-sm font-medium mb-1 line-clamp-2 leading-tight">
          {content.title}
        </h3>
        <p className="text-xs text-gray-300">
          {content.type === 'reel' ? `${content.views} مشاهدة` : `${content.likes} إعجاب`}
        </p>
      </div>
      
      {/* أزرار التفاعل */}
      <div className="absolute bottom-0 right-0 flex flex-col space-y-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            handleLike(content.id);
          }}
        >
          <Heart 
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              likedPosts.includes(content.id) 
                ? 'fill-red-500 text-red-500' 
                : 'text-white'
            }`} 
          />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
          <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 sm:pt-20 pb-20">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding py-4">
            {/* شريط البحث والتبويبات */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث عن مستخدمين، منشورات، ريلز..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 0) {
                      setActiveTab('all');
                    } else {
                      setActiveTab('explore');
                    }
                  }}
                  className="h-14 bg-gray-900 border-gray-700 text-white pr-12 text-lg"
                />
              </div>

              {searchQuery.length > 0 && (
                <div className="flex items-center justify-between">
                  <Select value={sortBy} onValueChange={(value: 'popularity' | 'date') => setSortBy(value)}>
                    <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="popularity" className="text-white hover:bg-gray-800 cursor-pointer">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <TrendingUp className="w-4 h-4" />
                          <span>الأكثر شعبية</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="date" className="text-white hover:bg-gray-800 cursor-pointer">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="w-4 h-4" />
                          <span>الأحدث</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* المحتوى */}
            {searchQuery.length === 0 ? (
              <>
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold neon-text mb-2">استكشف</h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-400">اكتشف محتوى جديد وحسابات تتناسب مع اهتماماتك</p>
                </div>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
                  {exploreContent.map((content) => (
                    <ExploreCard key={content.id} content={content} />
                  ))}
                </div>
              </>
            ) : loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-400">جاري البحث...</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-900 mb-6">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary">
                    الكل ({users.length + posts.length + reels.length})
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-primary">
                    مستخدمين ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="posts" className="data-[state=active]:bg-primary">
                    منشورات ({posts.length})
                  </TabsTrigger>
                  <TabsTrigger value="reels" className="data-[state=active]:bg-primary">
                    ريلز ({reels.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                  {users.length > 0 && (
                    <div>
                      <h2 className="text-white text-xl font-bold mb-4">مستخدمين</h2>
                      <div className="space-y-2">
                        {users.slice(0, 3).map((user) => (
                          <UserCard key={user.id} user={user} />
                        ))}
                      </div>
                      {users.length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full mt-4 text-primary"
                          onClick={() => setActiveTab('users')}
                        >
                          عرض جميع المستخدمين ({users.length})
                        </Button>
                      )}
                    </div>
                  )}

                  {posts.length > 0 && (
                    <div>
                      <h2 className="text-white text-xl font-bold mb-4">منشورات</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {posts.slice(0, 8).map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                      {posts.length > 8 && (
                        <Button
                          variant="ghost"
                          className="w-full mt-4 text-primary"
                          onClick={() => setActiveTab('posts')}
                        >
                          عرض جميع المنشورات ({posts.length})
                        </Button>
                      )}
                    </div>
                  )}

                  {reels.length > 0 && (
                    <div>
                      <h2 className="text-white text-xl font-bold mb-4">ريلز</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {reels.slice(0, 8).map((reel) => (
                          <ReelCard key={reel.id} reel={reel} />
                        ))}
                      </div>
                      {reels.length > 8 && (
                        <Button
                          variant="ghost"
                          className="w-full mt-4 text-primary"
                          onClick={() => setActiveTab('reels')}
                        >
                          عرض جميع الريلز ({reels.length})
                        </Button>
                      )}
                    </div>
                  )}

                  {users.length === 0 && posts.length === 0 && reels.length === 0 && (
                    <div className="text-center py-16">
                      <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد نتائج</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="users">
                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد مستخدمين</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts">
                  {posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد منشورات</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reels">
                  {reels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {reels.map((reel) => (
                        <ReelCard key={reel.id} reel={reel} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">لا توجد ريلز</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
