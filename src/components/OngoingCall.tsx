import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, MoreHorizontal, SwitchCamera, X } from 'lucide-react';
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
    setIsSpeaker(output === 'speaker');
    setShowAudioMenu(false);
  };

  // Desktop Voice/Audio Call UI - Compact Window Style
  const DesktopCallWindow = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] hidden md:flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div 
        className="relative w-[520px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #3d5a6c 0%, #2c4251 50%, #1e2d38 100%)',
        }}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a252d]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400" onClick={onEndCall} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/60 text-sm">مكالمة {callType === 'video' ? 'فيديو' : 'صوتية'}</span>
          <button 
            onClick={onEndCall}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center py-12 px-8">
          {/* Avatar with ring */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-600 border-4 border-gray-500 flex items-center justify-center overflow-hidden">
              {participant.avatar_url ? (
                <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-16 h-16 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Name & Duration */}
          <h2 className="text-white text-xl font-semibold mb-1">
            {participant.full_name || participant.username}
          </h2>
          <p className="text-white/70 text-base mb-8">{duration}</p>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute */}
            <button 
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-white text-gray-800' : 'bg-gray-600/80 hover:bg-gray-500/80 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isVideoOff ? 'bg-white text-gray-800' : 'bg-gray-600/80 hover:bg-gray-500/80 text-white'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Speaker */}
            <button 
              onClick={() => setShowAudioMenu(!showAudioMenu)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSpeaker ? 'bg-white text-gray-800' : 'bg-gray-600/80 hover:bg-gray-500/80 text-white'
              }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* More Options */}
            <button className="w-12 h-12 rounded-full bg-gray-600/80 hover:bg-gray-500/80 text-white flex items-center justify-center transition-all">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* End Call */}
            <button 
              onClick={onEndCall}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Menu */}
        <AnimatePresence>
          {showAudioMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-gray-800/95 backdrop-blur rounded-xl overflow-hidden shadow-xl border border-gray-700"
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 border-b border-gray-700 min-w-[180px]"
                onClick={() => selectAudioOutput('phone')}
              >
                <span>الهاتف</span>
                {!isSpeaker && <span className="text-blue-400">✓</span>}
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700"
                onClick={() => selectAudioOutput('speaker')}
              >
                <span>مكبر الصوت</span>
                {isSpeaker && <span className="text-blue-400">✓</span>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Mobile Voice Call UI - Full Screen
  const MobileVoiceCall = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col md:hidden"
      style={{
        background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center px-6 pt-14">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">
            {participant.full_name || participant.username}
          </h1>
          <p className="text-white/70 text-sm mt-0.5">{duration}</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
            <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
              {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Controls */}
      <div className="pb-10 px-6">
        <div className="flex items-center justify-center gap-5">
          <button 
            onClick={() => setShowAudioMenu(true)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeaker ? 'bg-white' : 'bg-white/15'
            }`}
          >
            <Volume2 className={`h-6 w-6 ${isSpeaker ? 'text-purple-600' : 'text-white'}`} />
          </button>

          <button onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white' : 'bg-white/15'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6 text-purple-600" /> : <Mic className="h-6 w-6 text-white" />}
          </button>

          <button
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Desktop Video Call UI
  const DesktopVideoCall = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] hidden md:flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="relative w-[640px] h-[480px] rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
        {/* Window Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400" onClick={onEndCall} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/80 text-sm font-medium">
            {participant.full_name || participant.username} • {duration}
          </span>
          <button 
            onClick={onEndCall}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Fallback when no video */}
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-900">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Local Video PIP */}
        {showLocalVideo && (
          <motion.div
            drag
            dragConstraints={{ left: -400, right: 0, top: 0, bottom: 280 }}
            className="absolute bottom-20 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl"
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

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-4 bg-gradient-to-t from-black/60 to-transparent">
          <button 
            onClick={toggleMute}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white text-gray-800' : 'bg-gray-700/80 hover:bg-gray-600/80 text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              !isVideoOff ? 'bg-white text-gray-800' : 'bg-gray-700/80 hover:bg-gray-600/80 text-white'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button className="w-11 h-11 rounded-full bg-gray-700/80 hover:bg-gray-600/80 text-white flex items-center justify-center transition-all">
            <SwitchCamera className="w-5 h-5" />
          </button>

          <button 
            onClick={onEndCall}
            className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Mobile Video Call UI
  const MobileVideoCall = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col md:hidden bg-black"
    >
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#4a1a7a] via-[#2d1050] to-[#1a0a30]">
          <Avatar className="w-32 h-32 border-4 border-white/20">
            <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
              {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-center px-6 pt-14 z-10">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white drop-shadow-lg">
            {participant.full_name || participant.username}
          </h1>
          <p className="text-white/80 text-sm mt-0.5 drop-shadow">{duration}</p>
        </div>
      </div>

      {showLocalVideo && (
        <motion.div
          drag
          dragConstraints={{ left: -150, right: 0, top: 0, bottom: 200 }}
          className="absolute bottom-48 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl z-10"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </motion.div>
      )}

      <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 z-10">
        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-white' : 'bg-black/50 backdrop-blur-sm'
            }`}
          >
            {isMuted ? <MicOff className="h-5 w-5 text-purple-600" /> : <Mic className="h-5 w-5 text-white" />}
          </button>

          <button onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !isVideoOff ? 'bg-white' : 'bg-black/50 backdrop-blur-sm'
            }`}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5 text-white" /> : <Video className="h-5 w-5 text-purple-600" />}
          </button>

          <button className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <SwitchCamera className="h-5 w-5 text-white" />
          </button>

          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render based on call type and device
  if (callType === 'voice' || isVideoOff) {
    return (
      <>
        <DesktopCallWindow />
        <MobileVoiceCall />
      </>
    );
  }

  return (
    <>
      <DesktopVideoCall />
      <MobileVideoCall />
    </>
  );
};

export default OngoingCall;
