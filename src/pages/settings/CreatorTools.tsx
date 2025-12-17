import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, TrendingUp, Users, Eye, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  posts_count: number;
  reels_count: number;
  total_likes: number;
  total_comments: number;
  followers_count: number;
  total_views: number;
}

const CreatorTools = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    posts_count: 0,
    reels_count: 0,
    total_likes: 0,
    total_comments: 0,
    followers_count: 0,
    total_views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', user.id)
        .single();

      // Get posts count and likes
      const { data: posts } = await supabase
        .from('posts')
        .select('id, likes_count, comments_count')
        .eq('user_id', user.id);

      // Get reels count and views
      const { data: reels } = await supabase
        .from('reels')
        .select('id, likes_count, comments_count, views_count')
        .eq('user_id', user.id);

      const totalPostLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
      const totalPostComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
      const totalReelLikes = reels?.reduce((sum, r) => sum + (r.likes_count || 0), 0) || 0;
      const totalReelComments = reels?.reduce((sum, r) => sum + (r.comments_count || 0), 0) || 0;
      const totalViews = reels?.reduce((sum, r) => sum + (r.views_count || 0), 0) || 0;

      setStats({
        posts_count: posts?.length || 0,
        reels_count: reels?.length || 0,
        total_likes: totalPostLikes + totalReelLikes,
        total_comments: totalPostComments + totalReelComments,
        followers_count: profile?.followers_count || 0,
        total_views: totalViews,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
    <div className="bg-card rounded-xl p-4">
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">أدوات المنشئ</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="font-bold">إحصائيات حسابك</h2>
            <p className="text-sm text-muted-foreground">نظرة عامة على أدائك</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={Users} 
            label="المتابعون" 
            value={stats.followers_count} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Eye} 
            label="المشاهدات" 
            value={stats.total_views} 
            color="bg-purple-500" 
          />
          <StatCard 
            icon={Heart} 
            label="الإعجابات" 
            value={stats.total_likes} 
            color="bg-red-500" 
          />
          <StatCard 
            icon={MessageSquare} 
            label="التعليقات" 
            value={stats.total_comments} 
            color="bg-green-500" 
          />
        </div>

        {/* Content Stats */}
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-bold mb-4">المحتوى الخاص بك</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">المنشورات</span>
              <span className="font-bold">{stats.posts_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الريلز</span>
              <span className="font-bold">{stats.reels_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">إجمالي المحتوى</span>
              <span className="font-bold">{stats.posts_count + stats.reels_count}</span>
            </div>
          </div>
        </div>

        {/* Growth Tips */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="font-bold">نصائح للنمو</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              انشر محتوى بانتظام للحفاظ على تفاعل متابعيك
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              استخدم الهاشتاجات المناسبة لزيادة الوصول
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              تفاعل مع تعليقات متابعيك لبناء مجتمع قوي
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
              جرب أنواع مختلفة من المحتوى (صور، فيديو، ريلز)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatorTools;
