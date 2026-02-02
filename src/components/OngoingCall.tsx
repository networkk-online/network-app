import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, ArrowLeft, MoreHorizontal, SwitchCamera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface OngoingCallProps {
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  callType: 'voice' | 'video';
  startTime: Date;
  onEndCall: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

const OngoingCall = ({ participant, callType, startTime, onEndCall, localStream, remoteStream }: OngoingCallProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState('00:00');
  const [showLocalVideo, setShowLocalVideo] = useState(true);
  const [showAudioMenu, setShowAudioMenu] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

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

  const selectAudioOutput = (output: string) => {
    if (output === 'speaker') {
      setIsSpeaker(true);
    } else {
      setIsSpeaker(false);
    }
    setShowAudioMenu(false);
  };

  // Voice Call UI
  if (callType === 'voice' || isVideoOff) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
        }}
      >
        {/* Desktop Container */}
        <div className="w-full h-full md:w-[420px] md:h-auto md:max-h-[90vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden flex flex-col bg-transparent md:bg-gradient-to-b md:from-[#4a1a7a] md:via-[#2d1050] md:to-[#1a0a30]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-14 md:pt-8">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {participant.full_name || participant.username}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">{duration}</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex-1 flex items-center justify-center py-12 md:py-16">
            <div className="relative">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/20 shadow-2xl">
                <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="text-4xl md:text-5xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                  {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-4 rounded-full border border-purple-400/20" />
              <div className="absolute -inset-8 rounded-full border border-purple-400/10" />
            </div>
          </div>

          {/* Audio Output Menu */}
          <AnimatePresence>
            {showAudioMenu && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-44 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[380px] bg-[#2d1050]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-purple-600/30 border-b border-purple-500/20 transition-colors"
                  onClick={() => selectAudioOutput('phone')}
                >
                  <span>الهاتف</span>
                  {!isSpeaker && <span className="text-purple-400 font-bold">✓</span>}
                </button>
                <button
                  className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-purple-600/30 border-b border-purple-500/20 transition-colors"
                  onClick={() => selectAudioOutput('speaker')}
                >
                  <span>مكبر الصوت</span>
                  {isSpeaker && <span className="text-purple-400 font-bold">✓</span>}
                </button>
                <button
                  className="w-full px-4 py-4 text-purple-400 hover:bg-purple-600/30 font-semibold transition-colors"
                  onClick={() => setShowAudioMenu(false)}
                >
                  إلغاء
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <div className="pb-10 md:pb-8 px-6">
            <div className="flex items-center justify-center gap-5 md:gap-6">
              {/* Speaker */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
                onClick={() => setShowAudioMenu(true)}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                  isSpeaker ? 'bg-white shadow-lg' : 'bg-white/15 hover:bg-white/25'
                }`}>
                  <Volume2 className={`h-6 w-6 md:h-7 md:w-7 ${isSpeaker ? 'text-purple-600' : 'text-white'}`} />
                </div>
              </motion.button>

              {/* Mute */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
                onClick={toggleMute}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-white shadow-lg' : 'bg-white/15 hover:bg-white/25'
                }`}>
                  {isMuted ? (
                    <MicOff className="h-6 w-6 md:h-7 md:w-7 text-purple-600" />
                  ) : (
                    <Mic className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  )}
                </div>
              </motion.button>

              {/* End Call */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-shadow"
                onClick={onEndCall}
              >
                <PhoneOff className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Video Call UI
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
    >
      {/* Desktop Container */}
      <div className="w-full h-full md:w-[480px] md:h-[85vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden relative">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Fallback when no video */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#4a1a7a] via-[#2d1050] to-[#1a0a30]">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white/20">
              <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-4xl md:text-5xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 pt-14 md:pt-6 z-10">
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white drop-shadow-lg">
              {participant.full_name || participant.username}
            </h1>
            <p className="text-white/80 text-sm mt-0.5 drop-shadow">{duration}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Local Video (PIP) */}
        {showLocalVideo && (
          <motion.div
            drag
            dragConstraints={{ left: -150, right: 0, top: 0, bottom: 200 }}
            className="absolute bottom-48 right-4 md:bottom-52 md:right-6 w-28 h-40 md:w-32 md:h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-10"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Fallback */}
            {!localStream && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">أنت</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Audio Output Menu */}
        <AnimatePresence>
          {showAudioMenu && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-48 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[380px] bg-black/90 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl z-20 border border-white/20"
            >
              <button
                className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-white/10 border-b border-white/10 transition-colors"
                onClick={() => selectAudioOutput('phone')}
              >
                <span>الهاتف</span>
                {!isSpeaker && <span className="text-purple-400 font-bold">✓</span>}
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-white/10 border-b border-white/10 transition-colors"
                onClick={() => selectAudioOutput('speaker')}
              >
                <span>مكبر الصوت</span>
                {isSpeaker && <span className="text-purple-400 font-bold">✓</span>}
              </button>
              <button
                className="w-full px-4 py-4 text-purple-400 hover:bg-white/10 font-semibold transition-colors"
                onClick={() => setShowAudioMenu(false)}
              >
                إلغاء
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-10 md:pb-8 px-6 z-10">
          <div className="flex items-center justify-center gap-4 md:gap-5">
            {/* Speaker */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAudioMenu(true)}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                isSpeaker ? 'bg-white shadow-lg' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70'
              }`}>
                <Volume2 className={`h-5 w-5 md:h-6 md:w-6 ${isSpeaker ? 'text-purple-600' : 'text-white'}`} />
              </div>
            </motion.button>

            {/* Mute */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-white shadow-lg' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70'
              }`}>
                {isMuted ? (
                  <MicOff className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                ) : (
                  <Mic className="h-5 w-5 md:h-6 md:w-6 text-white" />
                )}
              </div>
            </motion.button>

            {/* Video Toggle */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                !isVideoOff ? 'bg-white shadow-lg' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70'
              }`}>
                {isVideoOff ? (
                  <VideoOff className="h-5 w-5 md:h-6 md:w-6 text-white" />
                ) : (
                  <Video className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                )}
              </div>
            </motion.button>

            {/* Switch Camera */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-all">
                <SwitchCamera className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </motion.button>

            {/* End Call */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-shadow"
              onClick={onEndCall}
            >
              <PhoneOff className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OngoingCall;
