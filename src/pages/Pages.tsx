
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import PageCard from '@/components/PageCard';
import { Button } from '@/components/ui/button';
import { Search, Users, Building2, Tv, Star, MessageSquare, Send } from 'lucide-react';

const Pages = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'suggested' | 'following' | 'media'>('suggested');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for suggested pages
  const suggestedPages = [
    {
      id: '1',
      name: 'محمد صلاح',
      category: 'رياضة',
      type: 'celebrity' as const,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      cover: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop',
      followers: 2500000,
      description: 'لاعب كرة قدم مصري محترف',
      isVerified: true,
      isFollowing: false
    },
    {
      id: '2',
      name: 'شركة سامسونج',
      category: 'تكنولوجيا',
      type: 'business' as const,
      avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
      followers: 45000000,
      description: 'شركة تكنولوجيا عالمية رائدة',
      isVerified: true,
      isFollowing: false
    },
    {
      id: '3',
      name: 'BBC Arabic',
      category: 'إعلام',
      type: 'media' as const,
      avatar: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
      followers: 12000000,
      description: 'أخبار وتقارير باللغة العربية',
      isVerified: true,
      isFollowing: true
    },
    {
      id: '4',
      name: 'نانسي عجرم',
      category: 'فن',
      type: 'celebrity' as const,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop',
      followers: 8500000,
      description: 'مطربة وممثلة لبنانية',
      isVerified: true,
      isFollowing: false
    },
    {
      id: '5',
      name: 'الجزيرة',
      category: 'إعلام',
      type: 'media' as const,
      avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=200&fit=crop',
      followers: 18000000,
      description: 'شبكة إعلامية إخبارية',
      isVerified: true,
      isFollowing: true
    },
    {
      id: '6',
      name: 'كوكا كولا',
      category: 'مشروبات',
      type: 'business' as const,
      avatar: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1461936240180-d56286799af4?w=400&h=200&fit=crop',
      followers: 35000000,
      description: 'العلامة التجارية الأشهر في العالم',
      isVerified: true,
      isFollowing: false
    }
  ];

  // إضافة وسائل إعلام متخصصة للتواصل مع الصحفيين
  const mediaOutlets = [
    {
      id: '7',
      name: 'العربية نت',
      category: 'إعلام رقمي',
      type: 'media' as const,
      avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=200&fit=crop',
      followers: 15000000,
      description: 'منصة إعلامية رقمية - للتواصل مع الصحفيين',
      isVerified: true,
      isFollowing: false,
      specialties: ['سياسة', 'اقتصاد', 'تكنولوجيا'],
      contactInfo: 'للتواصل الإعلامي: media@alarabiya.net'
    },
    {
      id: '8',
      name: 'سكاي نيوز عربية',
      category: 'قناة إخبارية',
      type: 'media' as const,
      avatar: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop',
      followers: 8500000,
      description: 'قناة إخبارية - مقابلات مع الخبراء والمؤثرين',
      isVerified: true,
      isFollowing: true,
      specialties: ['أخبار عاجلة', 'مقابلات حصرية', 'تحليل سياسي'],
      contactInfo: 'للمقابلات الصحفية: interviews@skynewsarabia.com'
    },
    {
      id: '9',
      name: 'صحيفة الشرق الأوسط',
      category: 'صحافة مطبوعة',
      type: 'media' as const,
      avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150&h=150&fit=crop',
      cover: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=200&fit=crop',
      followers: 5200000,
      description: 'صحيفة يومية - تقارير متعمقة ومقالات رأي',
      isVerified: true,
      isFollowing: false,
      specialties: ['تقارير متعمقة', 'مقالات رأي', 'تحليلات اقتصادية'],
      contactInfo: 'للمقالات والتقارير: editors@aawsat.com'
    }
  ];

  const [pages, setPages] = useState([...suggestedPages, ...mediaOutlets]);

  const followingPages = pages.filter(page => page.isFollowing);
  const mediaPages = pages.filter(page => page.type === 'media');
  
  let displayPages;
  switch (activeTab) {
    case 'following':
      displayPages = followingPages;
      break;
    case 'media':
      displayPages = mediaPages;
      break;
    default:
      displayPages = pages;
  }

  const filteredPages = displayPages.filter(page =>
    page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFollow = (pageId: string) => {
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === pageId
          ? { ...page, isFollowing: !page.isFollowing }
          : page
      )
    );
  };

  const handleContactMedia = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      navigate('/messages', { 
        state: { 
          contactPage: page,
          message: `مرحباً، أود التواصل معكم بخصوص محتوى إعلامي في تخصصكم: ${page.category}` 
        }
      });
    }
  };

  const getTypeIcon = (type: 'celebrity' | 'business' | 'media') => {
    switch (type) {
      case 'celebrity':
        return <Star className="w-4 h-4" />;
      case 'business':
        return <Building2 className="w-4 h-4" />;
      case 'media':
        return <Tv className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">الصفحات</h1>
              <p className="text-gray-400">اكتشف وتابع صفحات المشاهير والشركات ووسائل الإعلام</p>
            </div>
            <Button onClick={() => navigate('/')} variant="ghost">
              العودة
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الصفحات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('suggested')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'suggested' 
                    ? 'bg-green-500 text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>مقترحة</span>
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'following' 
                    ? 'bg-green-500 text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>متابَعة ({followingPages.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === 'media' 
                    ? 'bg-green-500 text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>وسائل الإعلام ({mediaPages.length})</span>
              </button>
            </div>
          </div>

          {/* Special Media Section Info */}
          {activeTab === 'media' && (
            <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">التواصل مع وسائل الإعلام</h3>
              </div>
              <p className="text-gray-300 text-sm">
                يمكنك التواصل مباشرة مع الصحفيين وأصحاب النفوذ في وسائل الإعلام للمقابلات والتقارير الصحفية
              </p>
            </div>
          )}

          {/* Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPages.map((page) => (
              <div key={page.id} className="relative">
                <PageCard
                  {...page}
                  onFollow={() => handleFollow(page.id)}
                  typeIcon={getTypeIcon(page.type)}
                />
                
                {/* زر التواصل الإعلامي للصفحات الإعلامية */}
                {page.type === 'media' && (
                  <div className="mt-3 space-y-2">
                    <Button
                      onClick={() => handleContactMedia(page.id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      تواصل إعلامي
                    </Button>
                    
                    {/* معلومات إضافية للصفحات الإعلامية */}
                    {(page as any).specialties && (
                      <div className="bg-gray-900 rounded-lg p-3 text-sm">
                        <p className="text-gray-400 mb-1">التخصصات:</p>
                        <div className="flex flex-wrap gap-1">
                          {(page as any).specialties.map((specialty: string, index: number) => (
                            <span key={index} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                              {specialty}
                            </span>
                          ))}
                        </div>
                        {(page as any).contactInfo && (
                          <p className="text-gray-500 text-xs mt-2">{(page as any).contactInfo}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPages.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab === 'following' 
                  ? 'لا تتابع أي صفحة' 
                  : activeTab === 'media'
                  ? 'لم يتم العثور على وسائل إعلام'
                  : 'لم يتم العثور على صفحات'}
              </h3>
              <p className="text-gray-400">
                {activeTab === 'following' 
                  ? 'ابدأ بمتابعة بعض الصفحات المقترحة' 
                  : 'جرب البحث بكلمات أخرى'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pages;
