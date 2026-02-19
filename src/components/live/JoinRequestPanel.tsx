import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface JoinRequest {
  id: string;
  user_id: string;
  status: string;
  profile?: { username: string; avatar_url: string | null };
}

interface JoinRequestPanelProps {
  roomId: string;
  isHost: boolean;
}

export const JoinRequestPanel = ({ roomId, isHost }: JoinRequestPanelProps) => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    if (!isHost) return;

    const loadRequests = async () => {
      const { data } = await supabase
        .from('live_join_requests')
        .select('id, user_id, status')
        .eq('room_id', roomId)
        .eq('status', 'pending');
      
      if (data) {
        const withProfiles = await Promise.all(
          data.map(async (r) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', r.user_id)
              .single();
            return { ...r, profile: profile || undefined };
          })
        );
        setRequests(withProfiles);
      }
    };

    loadRequests();

    const channel = supabase
      .channel(`join-requests-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_join_requests',
        filter: `room_id=eq.${roomId}`,
      }, () => loadRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, isHost]);

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    await supabase
      .from('live_join_requests')
      .update({ status })
      .eq('id', requestId);
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  if (!isHost || requests.length === 0) return null;

  return (
    <div className="absolute top-16 right-3 z-30 pointer-events-auto">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="mb-2 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-3 flex items-center gap-3 min-w-[220px]"
          >
            <Avatar className="w-9 h-9 ring-1 ring-[#19e05b]/50">
              <AvatarImage src={req.profile?.avatar_url || ''} />
              <AvatarFallback className="bg-[#19e05b]/20 text-[#19e05b] text-xs">
                {req.profile?.username?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {req.profile?.username || 'مستخدم'}
              </p>
              <p className="text-white/40 text-[11px] flex items-center gap-1">
                <Hand className="w-3 h-3" /> يريد المشاركة
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                className="w-7 h-7 rounded-full bg-[#19e05b] hover:bg-[#19e05b]/80"
                onClick={() => handleRequest(req.id, 'approved')}
              >
                <Check className="w-3.5 h-3.5 text-black" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/40"
                onClick={() => handleRequest(req.id, 'rejected')}
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
