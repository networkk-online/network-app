import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Users, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface LiveRoom {
  id: string;
  host_id: string;
  title: string;
  viewer_count: number;
  created_at: string;
  host_profile?: { username: string; avatar_url: string | null };
}

interface LiveRoomsListProps {
  onJoinRoom: (roomId: string) => void;
}

export const LiveRoomsList = ({ onJoinRoom }: LiveRoomsListProps) => {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    const { data } = await supabase
      .from('live_rooms')
      .select('id, host_id, title, viewer_count, created_at')
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    if (data) {
      const withProfiles = await Promise.all(
        data.map(async (room) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', room.host_id)
            .single();
          return { ...room, host_profile: profile || undefined };
        })
      );
      setRooms(withProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();

    const channel = supabase
      .channel('live-rooms-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_rooms',
      }, () => loadRooms())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-[#19e05b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">لا يوجد بث مباشر حالياً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-3">
      <AnimatePresence>
        {rooms.map((room) => (
          <motion.button
            key={room.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => onJoinRoom(room.id)}
            className="relative bg-gradient-to-br from-[#0f0f1a] to-[#0a0a14] rounded-2xl overflow-hidden border border-white/5 hover:border-[#19e05b]/30 transition-colors text-right"
          >
            {/* Thumbnail area */}
            <div className="aspect-[4/5] bg-gradient-to-br from-[#19e05b]/5 to-transparent flex items-center justify-center">
              <Avatar className="w-16 h-16 ring-2 ring-[#19e05b]">
                <AvatarImage src={room.host_profile?.avatar_url || ''} />
                <AvatarFallback className="bg-[#19e05b]/20 text-[#19e05b] text-xl">
                  {room.host_profile?.username?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* LIVE badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[10px] font-bold">LIVE</span>
            </div>

            {/* Viewer count */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5">
              <Eye className="w-3 h-3 text-white/60" />
              <span className="text-white text-[10px]">{room.viewer_count}</span>
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-white text-sm font-medium truncate">
                {room.host_profile?.username || 'مستخدم'}
              </p>
              <p className="text-white/40 text-xs truncate">{room.title}</p>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
