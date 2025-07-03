
import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';
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

  // بيانات المحتوى المتنوع
  const exploreContent = [
    {
      id: '1',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=600&fit=crop',
      title: 'من تصبير محاص بالغش',
      views: '2.1M',
      duration: '0:45'
    },
    {
      id: '2',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=600&fit=crop',
      title: 'أرقام إيرادية',
      views: '890K',
      duration: '1:20'
    },
    {
      id: '3',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=600&fit=crop',
      title: 'الأخرى العلاقات المستحيلة',
      views: '1.5M',
      duration: '2:15'
    },
    {
      id: '4',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=600&fit=crop',
      title: 'POV: شفت أستاذ الى مردومه من المدرسة بتشرى في خلعت في ديران أونلاين',
      views: '3.2M',
      duration: '0:58'
    },
    {
      id: '5',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      title: 'عطر لجنس فقط',
      views: '756K',
      duration: '1:05'
    },
    {
      id: '6',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop',
      title: 'شرطة مبدوع فيج آذ شمعة',
      views: '2.8M',
      duration: '1:42'
    },
    {
      id: '7',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=600&fit=crop',
      title: 'محتوى حصري',
      views: '1.2M',
      duration: '0:33'
    },
    {
      id: '8',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=600&fit=crop',
      title: 'فيديو ترفيهي',
      views: '945K',
      duration: '2:07'
    },
    {
      id: '9',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop',
      title: 'لحظات مضحكة',
      views: '1.8M',
      duration: '1:15'
    }
  ];

  const formatViews = (views: string) => {
    return views;
  };

  const ExploreCard = ({ content }: { content: any }) => (
    <div className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-900">
      <div className="aspect-[4/5] relative">
        <img 
          src={content.thumbnail} 
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* تأثير التدرج */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        {/* أيقونة التشغيل */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
        
        {/* مدة الفيديو */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {content.duration}
        </div>
        
        {/* إجراءات سريعة */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* معلومات المحتوى */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="text-sm font-medium mb-1 line-clamp-2 leading-tight">
          {content.title}
        </h3>
        <p className="text-xs text-gray-300">
          {formatViews(content.views)} مشاهدة
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
            className={`w-5 h-5 ${
              likedPosts.includes(content.id) 
                ? 'fill-red-500 text-red-500' 
                : 'text-white'
            }`} 
          />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20">
          <Bookmark className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* شبكة المحتوى */}
          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {exploreContent.map((content) => (
              <ExploreCard key={content.id} content={content} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explore;
