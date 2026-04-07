import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Pause, Heart, MessageCircle, Trash2, Eye, Volume2, VolumeX, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Reel {
  id: string;
  video_url: string;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  created_at: string;
  user_id: string;
  profile?: { username: string; avatar_url: string | null };
}

const MasterReelsManager = () => {
  const { toast } = useToast();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReel, setActiveReel] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => { loadReels(); }, []);

  const loadReels = async () => {
    setLoading(true);
    const { data } = await supabase.from('reels').select('id, video_url, caption, likes_count, comments_count, views_count, created_at, user_id')
      .order('created_at', { ascending: false }).limit(50);
    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setReels(data.map(r => ({ ...r, profile: profileMap.get(r.user_id) })));
    }
    setLoading(false);
  };

  const togglePlay = (id: string) => {
    const video = videoRefs.current.get(id);
    if (!video) return;
    if (activeReel === id) {
      video.pause();
      setActiveReel(null);
    } else {
      videoRefs.current.forEach((v, key) => { if (key !== id) v.pause(); });
      video.play();
      setActiveReel(id);
    }
  };

  const deleteReel = async (id: string) => {
    await supabase.from('reels').delete().eq('id', id);
    setReels(prev => prev.filter(r => r.id !== id));
    toast({ title: '🗑️ تم حذف الريل' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{reels.length} ريل</p>
        <Button variant="outline" size="sm" onClick={loadReels} className="border-white/[0.1] text-white/60 hover:text-white">تحديث</Button>
      </div>

      {/* TikTok-style vertical grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {reels.map(reel => (
          <Card key={reel.id} className="bg-white/[0.03] border-white/[0.08] overflow-hidden rounded-2xl group relative">
            <div className="aspect-[9/16] relative bg-black">
              <video
                ref={el => { if (el) videoRefs.current.set(reel.id, el); }}
                src={reel.video_url}
                className="w-full h-full object-cover"
                loop
                muted={muted}
                playsInline
                onClick={() => togglePlay(reel.id)}
              />

              {/* Play overlay */}
              {activeReel !== reel.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={() => togglePlay(reel.id)}>
                  <Play className="w-10 h-10 text-white/80" fill="white" />
                </div>
              )}

              {/* Mute toggle */}
              <button onClick={() => setMuted(!muted)} className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50">
                {muted ? <VolumeX className="w-3.5 h-3.5 text-white/70" /> : <Volume2 className="w-3.5 h-3.5 text-white/70" />}
              </button>

              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                <p className="text-xs text-white/60 mb-1">@{reel.profile?.username || 'user'}</p>
                {reel.caption && <p className="text-xs text-white/80 line-clamp-2">{reel.caption}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-white/50"><Heart className="w-3 h-3" />{reel.likes_count || 0}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/50"><MessageCircle className="w-3 h-3" />{reel.comments_count || 0}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/50"><Eye className="w-3 h-3" />{reel.views_count || 0}</span>
                </div>
              </div>

              {/* Delete button */}
              <button onClick={() => deleteReel(reel.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/40">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {reels.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد ريلز بعد</p>
        </div>
      )}
    </div>
  );
};

export default MasterReelsManager;
