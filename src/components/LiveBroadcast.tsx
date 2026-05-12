import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, X, RotateCcw, Loader2 } from 'lucide-react';
import { DonationReplyDialog } from './DonationReplyDialog';
import { TikTokLiveOverlay } from './TikTokLiveOverlay';
import { AgoraVideoGrid } from './live/AgoraVideoGrid';
import { LiveStatsOverlay } from './live/LiveStatsOverlay';
import { LiveChatSidebar } from './live/LiveChatSidebar';
import { useAgoraRoom } from '@/hooks/useAgoraRoom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import type { LiveComment } from './live';

interface LiveBroadcastProps {
  onClose: () => void;
  joinRoomId?: string;
}

const LiveBroadcast = ({ onClose, joinRoomId }: LiveBroadcastProps) => {
  const { toast } = useToast();
  const agora = useAgoraRoom();

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
    if (!agora.isInRoom) {
      startPreview();
    }
    return () => stopPreview();
  }, [agora.isInRoom]);

  const startPreview = async () => {
    try {
      setPreviewError(null);
      // Check device availability first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCam = devices.some(d => d.kind === 'videoinput');
      const hasMic = devices.some(d => d.kind === 'audioinput');
      if (!hasCam || !hasMic) {
        throw Object.assign(new Error('NotFoundError'), { name: 'NotFoundError' });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setPreviewActive(true);
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
        setPreviewError('يرجى التأكد من توصيل الكاميرا والمايكروفون وإعطاء الصلاحية للمتصفح');
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPreviewError('تم رفض الإذن. يرجى السماح بالوصول للكاميرا والمايكروفون من إعدادات المتصفح');
      } else {
        setPreviewError('تعذر الوصول للكاميرا. تأكد من السماح بالأذونات.');
      }
      setPreviewActive(false);
    }
  };

  const stopPreview = () => {
    previewStreamRef.current?.getTracks().forEach(t => t.stop());
    previewStreamRef.current = null;
    setPreviewActive(false);
  };

  useEffect(() => {
    if (joinRoomId && !agora.isInRoom && !agora.isLoading) {
      agora.joinRoom(joinRoomId);
    }
  }, [joinRoomId]);

  const handleSendLiveComment = (message: string) => {
    setLiveComments(prev => [
      ...prev,
      { id: Date.now().toString(), username: 'أنت', message, isHost: agora.isHost },
    ]);
  };

  const startBroadcast = async () => {
    stopPreview();
    const room = await agora.createRoom(broadcastTitle || 'بث مباشر');
    if (room) {
      toast({ title: '🔴 بدأ البث المباشر!' });
    }
  };

  const stopBroadcast = async () => {
    await agora.leaveRoom();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex"
    >
      <div className="relative flex-1 min-w-0">
        {agora.isInRoom ? (
          <>
            <AgoraVideoGrid participants={agora.participants} />
            <LiveStatsOverlay stats={agora.stats} />
            <LiveChatSidebar comments={liveComments} onSend={handleSendLiveComment} />
            {agora.isHost && (
              <div className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#39FF14]/40">
                <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_10px_#39FF14]" />
                <span className="text-[#39FF14] text-xs font-black tracking-wider">LIVE</span>
              </div>
            )}
            <TikTokLiveOverlay
              streamerName={agora.isHost ? 'أنت' : 'المضيف'}
              viewerCount={agora.viewerCount}
              onClose={stopBroadcast}
              onSendComment={handleSendLiveComment}
              onSendGift={(giftType, amount) => console.log('Gift:', giftType, amount)}
              comments={liveComments}
              isHost={agora.isHost}
            />
          </>
        ) : (
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
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 mx-auto max-w-sm bg-white/[0.05] backdrop-blur-xl border border-[#39FF14]/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(57,255,20,0.15)]"
                  >
                    <p className="text-white text-sm mb-4 leading-relaxed">{previewError}</p>
                    <button
                      onClick={startPreview}
                      className="w-full py-2.5 rounded-xl bg-[#39FF14]/20 hover:bg-[#39FF14]/30 border border-[#39FF14]/50 text-[#39FF14] font-bold text-sm transition"
                    >
                      إعادة المحاولة
                    </button>
                  </motion.div>
                ) : previewActive ? (
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#39FF14] animate-pulse shadow-[0_0_10px_#39FF14]" />
                    <span className="text-white/70 text-sm">الكاميرا جاهزة</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                    <span className="text-white/60 text-sm">جاري تجهيز الكاميرا...</span>
                  </div>
                )}

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
      {!agora.isInRoom && (
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
                disabled={agora.isLoading || !previewActive || !!previewError}
                className="w-20 h-20 bg-[#39FF14] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {agora.isLoading ? (
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
      {agora.isInRoom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.switchCamera}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleCamera}
              className={`w-11 h-11 rounded-full ${
                agora.isCameraOff ? 'bg-red-500/60' : 'bg-black/50'
              } backdrop-blur-md border border-white/10`}
            >
              {agora.isCameraOff ? (
                <VideoOff className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </Button>
            {agora.isHost ? (
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
                onClick={stopBroadcast}
                className="px-4 py-2.5 bg-red-500/80 rounded-full"
              >
                <span className="text-white font-bold text-sm">مغادرة</span>
              </motion.button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={agora.toggleMute}
              className={`w-11 h-11 rounded-full ${
                agora.isMuted ? 'bg-red-500/60' : 'bg-black/50'
              } backdrop-blur-md border border-white/10`}
            >
              {agora.isMuted ? (
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
