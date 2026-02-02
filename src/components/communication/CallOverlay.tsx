import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, 
  Grid3X3, UserPlus, SwitchCamera, MoreHorizontal, X, Phone 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  callType: 'voice' | 'video';
  callStatus: 'connecting' | 'ringing' | 'active' | 'ended';
  startTime?: Date;
  onEndCall: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

export const CallOverlay = ({
  participant,
  callType,
  callStatus,
  startTime,
  onEndCall,
  localStream,
  remoteStream
}: CallOverlayProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState('00:00');
  const [showControls, setShowControls] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!startTime || callStatus !== 'active') return;
    
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, callStatus]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'جاري الاتصال...';
      case 'ringing': return 'جاري الرنين...';
      case 'active': return duration;
      case 'ended': return 'انتهت المكالمة';
    }
  };

  const ControlButton = ({ 
    icon: Icon, 
    active = false, 
    danger = false,
    onClick,
    label 
  }: { 
    icon: any; 
    active?: boolean; 
    danger?: boolean;
    onClick?: () => void;
    label: string;
  }) => (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <div className={cn(
        'w-14 h-14 rounded-full flex items-center justify-center transition-all',
        danger ? 'bg-red-500 shadow-lg shadow-red-500/40' :
        active ? 'bg-white text-gray-800' : 
        'bg-white/15 backdrop-blur-md hover:bg-white/25'
      )}>
        <Icon className={cn(
          'w-6 h-6',
          danger ? 'text-white' :
          active ? 'text-gray-800' : 'text-white'
        )} />
      </div>
      <span className="text-xs text-white/70">{label}</span>
    </motion.button>
  );

  // Pulse animation for avatar during ringing/connecting
  const PulsingAvatar = () => (
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
          <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
          <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      </motion.div>
      
      {/* Pulse rings */}
      {(callStatus === 'connecting' || callStatus === 'ringing') && (
        <>
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full border-2 border-purple-400"
          />
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
            className="absolute inset-0 rounded-full border-2 border-purple-400"
          />
          <motion.div
            animate={{ scale: [1, 2.1], opacity: [0.2, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
            className="absolute inset-0 rounded-full border-2 border-purple-400"
          />
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      onClick={() => callType === 'video' && setShowControls(!showControls)}
    >
      {/* Background */}
      {callType === 'video' && (remoteStream || localStream) ? (
        <div className="absolute inset-0 bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <PulsingAvatar />
            </div>
          )}
        </div>
      ) : (
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
          }}
        >
          {/* Blurred avatar background */}
          {participant.avatar_url && (
            <div 
              className="absolute inset-0 opacity-30 blur-3xl"
              style={{
                backgroundImage: `url(${participant.avatar_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center px-6 pt-14 z-10"
          >
            <div className="text-center">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">
                {participant.full_name || participant.username}
              </h1>
              <p className="text-white/80 text-sm mt-0.5 drop-shadow">{getStatusText()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Content - Voice Call Only */}
      {callType === 'voice' && (
        <div className="flex-1 flex items-center justify-center">
          <PulsingAvatar />
        </div>
      )}

      {/* Local Video PIP */}
      {callType === 'video' && showControls && (
        <motion.div
          drag
          dragConstraints={{ left: -150, right: 150, top: 100, bottom: 400 }}
          className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-20"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!localStream && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <span className="text-white text-sm">أنت</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-0 left-0 right-0 px-6 pb-10"
          >
            {/* Control Grid - iOS Style */}
            <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto mb-8">
              <ControlButton 
                icon={isMuted ? MicOff : Mic} 
                active={isMuted} 
                onClick={toggleMute}
                label="كتم"
              />
              <ControlButton 
                icon={Grid3X3} 
                label="لوحة المفاتيح"
              />
              <ControlButton 
                icon={Volume2} 
                active={isSpeaker}
                onClick={() => setIsSpeaker(!isSpeaker)}
                label="مكبر الصوت"
              />
              <ControlButton 
                icon={UserPlus} 
                label="إضافة"
              />
              <ControlButton 
                icon={isVideoOff ? VideoOff : Video} 
                active={!isVideoOff}
                onClick={toggleVideo}
                label="فيديو"
              />
              <ControlButton 
                icon={SwitchCamera} 
                label="تبديل الكاميرا"
              />
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEndCall}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
