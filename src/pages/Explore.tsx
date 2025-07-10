
import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Bookmark, MoreHorizontal, User } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';

const Explore = () => {
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

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
      
      <main className="pt-16 sm:pt-20">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding py-4">
            {/* عنوان الصفحة */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold neon-text mb-2">استكشف</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-400">اكتشف محتوى جديد وحسابات تتناسب مع اهتماماتك</p>
            </div>

            {/* شبكة المحتوى المتنوع - متجاوبة */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
              {exploreContent.map((content) => (
                <ExploreCard key={content.id} content={content} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
