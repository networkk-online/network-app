import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, X, RotateCcw, Loader2, Radio } from 'lucide-react';
import { DonationReplyDialog } from './DonationReplyDialog';
import { TikTokLiveOverlay } from './TikTokLiveOverlay';
import { DailyVideoGrid } from './live/DailyVideoGrid';
import { AgoraVideoGrid } from './live/AgoraVideoGrid';
import { JoinRequestPanel } from './live/JoinRequestPanel';
import { useDailyRoom } from '@/hooks/useDailyRoom';
import { useAgoraRoom } from '@/hooks/useAgoraRoom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import type { LiveComment } from './live';

type StreamEngine = 'daily' | 'agora';

interface LiveBroadcastProps {
  onClose: () => void;
  joinRoomId?: string;
}

const LiveBroadcast = ({ onClose, joinRoomId }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const [engine, setEngine] = useState<StreamEngine>('agora');

  // Daily.co engine
  const daily = useDailyRoom();
  // Agora engine
  const agora = useAgoraRoom();

  // Unified state based on selected engine
  const active = engine === 'agora' ? agora : daily;

  const [liveComments, setLiveComments] = useState<LiveComment[]>([
    { id: '1', username: 'سيف_العراق', message: 'يا هلا! 🔥', isVIP: true },
    { id: '2', username: 'نور123', message: 'شلون الحال؟' },
  ]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');

  // === Local camera preview ===
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!active.isInRoom) {
      startPreview();
    }
    return () => stopPreview();
  }, [active.isInRoom]);

  const startPreview = async () => {
    try {
      setPreviewError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setPreviewActive(true);
    } catch {
      setPreviewError('تعذر الوصول للكاميرا. تأكد من السماح بالأذونات.');
      setPreviewActive(false);
    }
  };

  const stopPreview = () => {
    previewStreamRef.current?.getTracks().forEach(t => t.stop());
    previewStreamRef.current = null;
    setPreviewActive(false);
  };

  useEffect(() => {
    if (joinRoomId && !active.isInRoom && !active.isLoading) {
      active.joinRoom(joinRoomId);
    }
  }, [joinRoomId]);

  const handleSendLiveComment = (message: string) => {
    setLiveComments(prev => [
      ...prev,
      { id: Date.now().toString(), username: 'أنت', message, isHost: active.isHost },
    ]);
  };

  const startBroadcast = async () => {
    stopPreview();
    const room = await active.createRoom(broadcastTitle || 'بث مباشر');
    if (room) {
      toast({ title: '🔴 بدأ البث المباشر!', description: `محرك: ${engine === 'agora' ? 'Agora' : 'Daily'}` });
    }
  };

  const stopBroadcast = async () => {
    await active.leaveRoom();
    onClose();
  };

  const handleRequestToJoin = async () => {
    if (engine === 'daily' && daily.roomId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('live_join_requests').insert({ room_id: daily.roomId, user_id: user.id });
      if (!error) toast({ title: 'تم إرسال طلب المشاركة' });
    }
  };

  const roomId = engine === 'daily' ? (daily as any).roomId : agora.channelName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex"
    >
      <div className="relative flex-1 min-w-0">
        {active.isInRoom ? (
          <>
            {engine === 'agora' ? (
              <AgoraVideoGrid participants={agora.participants} />
            ) : (
              <DailyVideoGrid participants={daily.participants} />
            )}
            <TikTokLiveOverlay
              streamerName={active.isHost ? 'أنت' : 'المضيف'}
              viewerCount={active.viewerCount}
              onClose={stopBroadcast}
              onSendComment={handleSendLiveComment}
              onSendGift={(giftType, amount) => console.log('Gift:', giftType, amount)}
              comments={liveComments}
              isHost={active.isHost}
            />
            {engine === 'daily' && roomId && (
              <JoinRequestPanel roomId={roomId} isHost={active.isHost} />
            )}
          </>
        ) : (
          /* Pre-live screen with CAMERA PREVIEW */
          <div className="w-full h-full relative overflow-hidden">
            {previewActive ? (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0f] to-[#0a0a0a]" />
            )}

            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center px-6"
              >
                {previewError ? (
                  <p className="text-red-400 text-sm mb-4">{previewError}</p>
                ) : previewActive ? (
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-white/70 text-sm">الكاميرا جاهزة</span>
                  </div>
                ) : null}

                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(25,224,91,0)',
                      '0 0 40px 15px rgba(25,224,91,0.2)',
                      '0 0 0 0 rgba(25,224,91,0)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-24 h-24 bg-gradient-to-br from-[#19e05b] to-[#0f8a3a] rounded-full mx-auto mb-5 flex items-center justify-center"
                >
                  <Video className="w-12 h-12 text-black" />
                </motion.div>

                <h2 className="text-xl font-bold text-white mb-1">جاهز للبث المباشر؟</h2>
                <p className="text-white/40 text-sm mb-4">اضغط على "بدء البث" للانطلاق</p>

                {/* Engine selector */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <button
                    onClick={() => setEngine('agora')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      engine === 'agora'
                        ? 'bg-[#19e05b] text-black shadow-[0_0_20px_rgba(25,224,91,0.3)]'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    <Radio className="w-3 h-3 inline mr-1" />
                    Agora
                  </button>
                  <button
                    onClick={() => setEngine('daily')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      engine === 'daily'
                        ? 'bg-[#19e05b] text-black shadow-[0_0_20px_rgba(25,224,91,0.3)]'
                        : 'bg-white/10 text-white/50 hover:bg-white/20'
                    }`}
                  >
                    <Radio className="w-3 h-3 inline mr-1" />
                    Daily
                  </button>
                </div>

                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="عنوان البث (اختياري)..."
                  className="w-full max-w-xs bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-sm placeholder:text-white/30 outline-none focus:border-[#19e05b]/50 backdrop-blur-md"
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Pre-live controls */}
      {!active.isInRoom && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-white">البث المباشر</h1>
            <div className="w-10" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent z-20">
            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startBroadcast}
                disabled={active.isLoading}
                className="w-20 h-20 bg-[#19e05b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(25,224,91,0.4)] disabled:opacity-50"
              >
                {active.isLoading ? (
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                ) : (
                  <span className="text-black font-black text-lg">بدء</span>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}

      {/* Live controls */}
      {active.isInRoom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={active.switchCamera}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={active.toggleCamera}
              className={`w-11 h-11 rounded-full ${
                active.isCameraOff ? 'bg-red-500/60' : 'bg-black/50'
              } backdrop-blur-md border border-white/10`}
            >
              {active.isCameraOff ? (
                <VideoOff className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </Button>
            {active.isHost ? (
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
              onClick={active.toggleMute}
              className={`w-11 h-11 rounded-full ${
                active.isMuted ? 'bg-red-500/60' : 'bg-black/50'
              } backdrop-blur-md border border-white/10`}
            >
              {active.isMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </Button>
          </div>
        </div>
      )}

      {selectedDonation && (
        <DonationReplyDialog
          isOpen={replyDialogOpen}
          onClose={() => {
            setReplyDialogOpen(false);
            setSelectedDonation(null);
          }}
          donation={selectedDonation}
        />
      )}
    </motion.div>
  );
};

export default LiveBroadcast;
