import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { IAgoraRTCRemoteUser, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import type { ActiveCall, CallQuality } from '@/hooks/useAgoraCall';

interface Props {
  call: ActiveCall;
  remoteUsers: IAgoraRTCRemoteUser[];
  localVideoTrack: ICameraVideoTrack | null;
  isMuted: boolean;
  isCameraOff: boolean;
  joining: boolean;
  permissionError: 'denied' | 'unavailable' | null;
  quality: CallQuality;
  connectionMessage: string | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onEndCall: () => void;
}

export const ActiveCallScreen = ({
  call,
  remoteUsers,
  localVideoTrack,
  isMuted,
  isCameraOff,
  joining,
  permissionError,
  quality,
  connectionMessage,
  onToggleMute,
  onToggleCamera,
  onFlipCamera,
  onEndCall,
}: Props) => {
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const [pipPos, setPipPos] = useState({ x: 16, y: 80 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Mount/unmount remote video
  useEffect(() => {
    const remote = remoteUsers.find((u) => u.videoTrack);
    if (remote?.videoTrack && remoteContainerRef.current) {
      remote.videoTrack.play(remoteContainerRef.current);
    }
    return () => {
      remote?.videoTrack?.stop();
    };
  }, [remoteUsers]);

  // Mount/unmount local video
  useEffect(() => {
    if (localVideoTrack && localContainerRef.current && !isCameraOff) {
      localVideoTrack.play(localContainerRef.current, { fit: 'cover' });
    }
    return () => {
      localVideoTrack?.stop();
    };
  }, [localVideoTrack, isCameraOff]);

  // Call timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (call.status !== 'accepted') return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [call.status]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  // PiP drag
  const onPipPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pipPos.x, origY: pipPos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPipPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const maxX = window.innerWidth - 130;
    const maxY = window.innerHeight - 180;
    setPipPos({
      x: Math.max(8, Math.min(maxX, dragRef.current.origX - dx)),
      y: Math.max(8, Math.min(maxY, dragRef.current.origY + dy)),
    });
  };
  const onPipPointerUp = () => { dragRef.current = null; };

  const hasRemoteVideo = remoteUsers.some((u) => u.videoTrack);
  const isOutgoingWaiting = call.direction === 'outgoing' && call.status !== 'accepted';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black overflow-hidden"
    >
      {/* Remote video (full screen) */}
      <div ref={remoteContainerRef} className="absolute inset-0 bg-black" />

      {/* Fallback when no remote video: blurred avatar + label */}
      {(!hasRemoteVideo || call.call_type === 'voice' || isOutgoingWaiting) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {call.peer.avatar_url && (
            <div
              className="absolute inset-0 opacity-40 blur-3xl scale-125"
              style={{
                backgroundImage: `url(${call.peer.avatar_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
            >
              <Avatar className="w-32 h-32 border-4 border-[#00FF00]/50 shadow-[0_0_50px_rgba(0,255,0,0.4)]">
                <AvatarImage src={call.peer.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="text-5xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
                  {call.peer.full_name?.charAt(0) || call.peer.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold text-white">
              {call.peer.full_name || call.peer.username}
            </h2>
            <p className="mt-2 text-[#00FF00]/80 text-sm tracking-wider">
              {joining
                ? 'جاري الاتصال...'
                : isOutgoingWaiting
                ? 'في انتظار الرد...'
                : call.status === 'accepted'
                ? `${mm}:${ss}`
                : ''}
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-6 px-6 space-y-3">
        <div className="mx-auto max-w-sm rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 px-4 py-2 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2 shadow-[0_0_8px_hsl(var(--primary))]" />
          <span className="text-white/90 text-sm font-medium">
            {call.status === 'accepted' ? `${mm}:${ss}` : 'متصل...'}
          </span>
        </div>
        <QualityBadge quality={quality} message={connectionMessage} />
      </div>

      {/* Permission error toast */}
      {permissionError && (
        <div className="absolute top-24 left-4 right-4 z-20 mx-auto max-w-md rounded-2xl bg-red-500/15 backdrop-blur-xl border border-red-500/40 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white">
            {permissionError === 'denied'
              ? 'تم رفض إذن الوصول للميكروفون / الكاميرا. يرجى السماح من إعدادات المتصفح.'
              : 'لا يمكن الوصول إلى الميكروفون أو الكاميرا.'}
          </div>
        </div>
      )}

      {/* Local PiP preview (draggable) */}
      {call.call_type === 'video' && (
        <div
          ref={pipRef}
          onPointerDown={onPipPointerDown}
          onPointerMove={onPipPointerMove}
          onPointerUp={onPipPointerUp}
          style={{ right: pipPos.x, top: pipPos.y, touchAction: 'none' }}
          className="absolute z-20 w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#00FF00]/40 shadow-[0_0_25px_rgba(0,255,0,0.3)] bg-black cursor-grab active:cursor-grabbing"
        >
          <div ref={localContainerRef} className="w-full h-full" />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <VideoOff className="h-6 w-6 text-white/70" />
            </div>
          )}
        </div>
      )}

      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 px-4">
        <div className="mx-auto max-w-md rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 px-5 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around">
            <ControlButton active={!isMuted} onClick={onToggleMute} label={isMuted ? 'إلغاء الكتم' : 'كتم'}>
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </ControlButton>

            {call.call_type === 'video' && (
              <ControlButton active={!isCameraOff} onClick={onToggleCamera} label="الكاميرا">
                {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </ControlButton>
            )}

            {call.call_type === 'video' && (
              <ControlButton active onClick={onFlipCamera} label="قلب">
                <SwitchCamera className="h-5 w-5" />
              </ControlButton>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onEndCall}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_25px_rgba(255,0,40,0.5)]">
                <PhoneOff className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-white/80">إنهاء</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ControlButton = ({
  active, onClick, label, children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="flex flex-col items-center gap-1.5"
  >
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all ${
        active
          ? 'bg-[#00FF00]/15 border-[#00FF00]/50 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.3)]'
          : 'bg-white/10 border-white/20 text-white/80'
      }`}
    >
      {children}
    </div>
    <span className="text-[10px] text-white/70">{label}</span>
  </motion.button>
);
