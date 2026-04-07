import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pin, PinOff, Search, Grid3X3, Play, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  user_id: string;
  profile?: { username: string; avatar_url: string | null };
}

interface PinnedPost {
  id: string;
  post_id: string;
  position: number;
}

const MasterExploreControl = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [postsRes, pinnedRes] = await Promise.all([
      supabase.from('posts').select('id, content, media_url, likes_count, comments_count, user_id')
        .order('likes_count', { ascending: false }).limit(50),
      supabase.from('pinned_explore_posts').select('*').order('position', { ascending: true }),
    ]);

    if (postsRes.data) {
      const userIds = [...new Set(postsRes.data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setPosts(postsRes.data.map(p => ({ ...p, profile: profileMap.get(p.user_id) })));
    }
    setPinnedPosts(pinnedRes.data || []);
    setLoading(false);
  };

  const pinPost = async (postId: string) => {
    if (pinnedPosts.length >= 3) {
      toast({ title: '⚠️ الحد الأقصى 3 منشورات مثبتة', variant: 'destructive' });
      return;
    }
    const nextPosition = pinnedPosts.length > 0 ? Math.max(...pinnedPosts.map(p => p.position)) + 1 : 1;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('pinned_explore_posts').insert({
      post_id: postId, position: nextPosition, pinned_by: user?.id || '00000000-0000-0000-0000-000000000000',
    });
    toast({ title: '📌 تم التثبيت في الاستكشاف' });
    loadData();
  };

  const unpinPost = async (postId: string) => {
    await supabase.from('pinned_explore_posts').delete().eq('post_id', postId);
    toast({ title: '✅ تم إلغاء التثبيت' });
    loadData();
  };

  const isPinned = (postId: string) => pinnedPosts.some(p => p.post_id === postId);

  const filtered = searchQuery.trim()
    ? posts.filter(p => p.content?.includes(searchQuery) || p.profile?.username?.includes(searchQuery))
    : posts;

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
        {Array.from({ length: 15 }).map((_, i) => <Skeleton key={i} className="aspect-square bg-white/[0.04] rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pinned Section */}
      <Card className="bg-white/[0.03] border-[#39FF14]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#39FF14] text-sm flex items-center gap-2">
            <Pin className="w-4 h-4" /> المنشورات المثبتة ({pinnedPosts.length}/3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedPosts.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">لا توجد منشورات مثبتة — اختر من الشبكة أدناه</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {pinnedPosts.map(pin => {
                const post = posts.find(p => p.id === pin.post_id);
                if (!post) return null;
                return (
                  <div key={pin.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#39FF14]/30 group">
                    {post.media_url ? (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center p-2">
                        <p className="text-[10px] text-white/50 text-center line-clamp-3">{post.content}</p>
                      </div>
                    )}
                    <Badge className="absolute top-1 right-1 bg-[#39FF14] text-black text-[9px] px-1.5">#{pin.position}</Badge>
                    <button onClick={() => unpinPost(post.id)}
                      className="absolute bottom-1 left-1 p-1 rounded-full bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PinOff className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="بحث في المنشورات..."
          className="w-full h-10 bg-white/[0.04] border border-white/[0.1] rounded-xl pr-10 pl-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#39FF14]/30"
        />
      </div>

      {/* Instagram-style 5-column grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-[2px]">
        {filtered.map(post => {
          const pinned = isPinned(post.id);
          const isVideo = post.media_url?.includes('.mp4') || post.media_url?.includes('.webm');
          return (
            <div key={post.id} className="relative aspect-square overflow-hidden group cursor-pointer bg-white/[0.02] rounded-sm">
              {post.media_url ? (
                <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2 bg-white/[0.03]">
                  <p className="text-[10px] text-white/40 text-center line-clamp-3">{post.content}</p>
                </div>
              )}

              {/* Video/Multi indicators */}
              {isVideo && (
                <div className="absolute top-1.5 right-1.5">
                  <Play className="w-4 h-4 text-white drop-shadow" fill="white" strokeWidth={0} />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-3 text-white text-xs">
                  <span>❤️ {post.likes_count || 0}</span>
                  <span>💬 {post.comments_count || 0}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => pinned ? unpinPost(post.id) : pinPost(post.id)}
                  className={pinned
                    ? 'bg-red-500/80 text-white text-[10px] h-7 hover:bg-red-600'
                    : 'bg-[#39FF14]/80 text-black text-[10px] h-7 hover:bg-[#39FF14]'
                  }
                >
                  {pinned ? <><PinOff className="w-3 h-3 mr-1" />إلغاء</> : <><Pin className="w-3 h-3 mr-1" />تثبيت</>}
                </Button>
              </div>

              {pinned && (
                <div className="absolute top-1 left-1">
                  <Badge className="bg-[#39FF14] text-black text-[8px] px-1 py-0">📌</Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MasterExploreControl;
