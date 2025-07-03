
import React, { useState } from 'react';
import { TrendingUp, Star, Users, Eye, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Explore = () => {
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const handleLike = (postId: string) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  // محتوى شائع
  const trendingPosts = [
    {
      id: '1',
      type: 'trending',
      title: 'أحدث تقنيات الذكاء الاصطناعي',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
      author: 'محمد التقني',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      views: 12500,
      likes: 890,
      comments: 234,
      tag: 'تقنية'
    },
    {
      id: '2',
      type: 'trending',
      title: 'رحلة إلى أجمل الأماكن الطبيعية',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      author: 'سارة المسافرة',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face',
      views: 8750,
      likes: 1200,
      comments: 89,
      tag: 'سفر'
    },
    {
      id: '3',
      type: 'trending',
      title: 'وصفات طعام صحية ولذيذة',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      author: 'أحمد الطبخ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      views: 6890,
      likes: 567,
      comments: 123,
      tag: 'طعام'
    }
  ];

  // محتوى موصى به
  const recommendedPosts = [
    {
      id: '4',
      type: 'recommended',
      title: 'تطوير التطبيقات بأحدث الأدوات',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      author: 'علي المطور',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      views: 4500,
      likes: 340,
      comments: 67,
      tag: 'برمجة'
    },
    {
      id: '5',
      type: 'recommended',
      title: 'فنون الرسم والتصميم الرقمي',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
      author: 'ليلى الفنانة',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      views: 3200,
      likes: 890,
      comments: 156,
      tag: 'فن'
    },
    {
      id: '6',
      type: 'recommended',
      title: 'نصائح للتصوير الفوتوغرافي',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      author: 'كريم المصور',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      views: 5670,
      likes: 432,
      comments: 78,
      tag: 'تصوير'
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}م`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}ك`;
    }
    return num.toString();
  };

  const PostCard = ({ post }: { post: any }) => (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-green-500/30 transition-all duration-300">
      <div className="relative">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-green-500 text-black">
          {post.tag}
        </Badge>
        {post.type === 'trending' && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            شائع
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <img 
            src={post.avatar} 
            alt={post.author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-white font-medium text-sm">{post.author}</span>
        </div>
        
        <h3 className="text-white font-bold mb-3 line-clamp-2">{post.title}</h3>
        
        <div className="flex items-center justify-between text-gray-400 text-sm mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(post.views)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{formatNumber(post.likes)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{formatNumber(post.comments)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-800"
              onClick={() => handleLike(post.id)}
            >
              <Heart 
                className={`w-5 h-5 ${
                  likedPosts.includes(post.id) 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                }`} 
              />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-800">
              <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-800">
              <Share2 className="w-5 h-5 text-gray-400 hover:text-white" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-800">
            <Bookmark className="w-5 h-5 text-gray-400 hover:text-white" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">استكشاف</h1>
            <p className="text-gray-400">اكتشف المحتوى الشائع والموصى به خصيصاً لك</p>
          </div>

          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="bg-gray-900 border-gray-800 mb-8">
              <TabsTrigger 
                value="trending" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>شائع</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recommended"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>موصى به</span>
              </TabsTrigger>
              <TabsTrigger 
                value="popular"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-black flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>الأكثر شعبية</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommended" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...trendingPosts, ...recommendedPosts].map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Explore;
