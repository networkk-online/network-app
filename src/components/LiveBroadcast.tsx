import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, X, RotateCcw, Loader2 } from 'lucide-react';
import { DonationReplyDialog } from './DonationReplyDialog';
import { TikTokLiveOverlay } from './TikTokLiveOverlay';
import { DailyVideoGrid } from './live/DailyVideoGrid';
import { JoinRequestPanel } from './live/JoinRequestPanel';
import { useDailyRoom } from '@/hooks/useDailyRoom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import type { LiveComment } from './live';

interface LiveBroadcastProps {
  onClose: () => void;
  joinRoomId?: string; // If provided, join as viewer
}

const LiveBroadcast = ({ onClose, joinRoomId }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const {
    isInRoom,
    isLoading,
    isHost,
    roomId,
    participants,
    viewerCount,
    isMuted,
    isCameraOff,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleCamera,
    switchCamera,
  } = useDailyRoom();

  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', username: 'سيف_العراق', message: 'يا هلا! 🔥', isVIP: true },
    { id: '2', username: 'نور123', message: 'شلون الحال؟' },
  ]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');

  // Auto-join if joinRoomId is provided
  useEffect(() => {
    if (joinRoomId && !isInRoom && !isLoading) {
      joinRoom(joinRoomId);
    }
  }, [joinRoomId]);

  const handleSendLiveComment = (message: string) => {
    const newComment: LiveComment = {
      id: Date.now().toString(),
      username: 'أنت',
      message,
      isHost: isHost,
    };
    setLiveComments(prev => [...prev, newComment]);
  };

  const startBroadcast = async () => {
    const room = await createRoom(broadcastTitle || 'بث مباشر');
    if (room) {
      toast({ title: '🔴 بدأ البث المباشر!', description: 'أنت الآن مباشر' });
    }
  };

  const stopBroadcast = async () => {
    await leaveRoom();
    onClose();
  };

  const handleRequestToJoin = async () => {
    if (!roomId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('live_join_requests')
      .insert({ room_id: roomId, user_id: user.id });

    if (!error) {
      toast({ title: 'تم إرسال طلب المشاركة', description: 'بانتظار موافقة المضيف' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex"
    >
      {/* ═══ VIDEO CONTAINER ═══ */}
      <div className="relative flex-1 min-w-0">
        {isInRoom ? (
          <>
            {/* Daily.co Video Grid */}
            <DailyVideoGrid participants={participants} />

            {/* TikTok-style overlay */}
            <TikTokLiveOverlay
              streamerName={isHost ? 'أنت' : 'المضيف'}
              viewerCount={viewerCount}
              onClose={stopBroadcast}
              onSendComment={handleSendLiveComment}
              onSendGift={(giftType, amount) => {
                console.log('Gift sent:', giftType, amount);
              }}
              comments={liveComments}
              isHost={isHost}
            />

            {/* Join Request Panel (host only) */}
            {roomId && <JoinRequestPanel roomId={roomId} isHost={isHost} />}
          </>
        ) : (
          /* Pre-live screen */
          <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0f] to-[#0a0a0a] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center px-6"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(25, 224, 91, 0)',
                    '0 0 40px 15px rgba(25, 224, 91, 0.2)',
                    '0 0 0 0 rgba(25, 224, 91, 0)',
                  ],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-28 h-28 bg-gradient-to-br from-[#19e05b] to-[#0f8a3a] rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <Video className="w-14 h-14 text-black" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">جاهز للبث المباشر؟</h2>
              <p className="text-white/40 text-sm mb-6">اضغط على "بدء البث" للانطلاق</p>

              {/* Title input */}
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="عنوان البث (اختياري)..."
                className="w-full max-w-xs bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-sm placeholder:text-white/30 outline-none focus:border-[#19e05b]/50 mb-6"
              />
            </motion.div>
          </div>
        )}
      </div>

      {/* ═══ PRE-LIVE CONTROLS ═══ */}
      {!isInRoom && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-white">البث المباشر</h1>
            <div className="w-10" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startBroadcast}
                disabled={isLoading}
                className="w-20 h-20 bg-[#19e05b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(25,224,91,0.4)] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                ) : (
                  <span className="text-black font-black text-lg">بدء</span>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* ═══ LIVE CONTROLS ═══ */}
      {isInRoom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCamera}
              className={`w-11 h-11 rounded-full ${isCameraOff ? 'bg-red-500/60' : 'bg-black/50'} backdrop-blur-md border border-white/10`}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
            </Button>

            {isHost ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={stopBroadcast}
                className="px-6 py-2.5 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                <span className="text-white font-bold">إنهاء البث</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRequestToJoin}
                className="px-4 py-2.5 bg-[#19e05b] rounded-full"
              >
                <span className="text-black font-bold text-sm">طلب مشاركة</span>
              </motion.button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className={`w-11 h-11 rounded-full ${isMuted ? 'bg-red-500/60' : 'bg-black/50'} backdrop-blur-md border border-white/10`}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </Button>
          </div>
        </div>
      )}

      {selectedDonation && (
        <DonationReplyDialog
          isOpen={replyDialogOpen}
          onClose={() => { setReplyDialogOpen(false); setSelectedDonation(null); }}
          donation={selectedDonation}
        />
      )}
    </motion.div>
  );
};

export default LiveBroadcast;
