import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Plus, Grid3X3, Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 50%, #1c1c1e 100%)',
      }}
    >
      {/* Video Area for Video Calls */}
      {callType === 'video' && !isVideoOff ? (
        <div className="flex-1 relative">
          {/* Remote Video (Full Screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Local Video (PIP) */}
          {showLocalVideo && (
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl"
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

          {/* Gradient Overlays */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Voice Call / Video Off UI */
        <div className="flex-1 flex flex-col items-center justify-center">
          <Avatar className="w-24 h-24 border-2 border-white/20">
            <AvatarImage src={participant.avatar_url || ''} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
              {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Top Bar - Caller Info */}
      <div className="absolute top-0 left-0 right-0 pt-12 px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">
              {participant.full_name || participant.username}
            </h1>
            <p className="text-green-400 text-base mt-1">{duration}</p>
          </div>
          <div className="flex-1 flex justify-end">
            <Avatar className="w-10 h-10 border border-white/20">
              <AvatarImage src={participant.avatar_url || ''} />
              <AvatarFallback className="text-sm bg-gray-600 text-white">
                {participant.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Audio Output Menu */}
      <AnimatePresence>
        {showAudioMenu && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-56 left-4 right-4 bg-[#2c2c2e] rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-gray-700/50 border-b border-gray-700/50"
              onClick={() => selectAudioOutput('phone')}
            >
              <span>الهاتف</span>
              {!isSpeaker && <span className="text-blue-400">✓</span>}
            </button>
            <button
              className="w-full flex items-center justify-between px-4 py-4 text-white hover:bg-gray-700/50 border-b border-gray-700/50"
              onClick={() => selectAudioOutput('speaker')}
            >
              <span>مكبر الصوت</span>
              {isSpeaker && <span className="text-blue-400">✓</span>}
            </button>
            <button
              className="w-full px-4 py-4 text-blue-400 hover:bg-gray-700/50 font-medium"
              onClick={() => setShowAudioMenu(false)}
            >
              إلغاء
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 px-6">
        {/* Control Grid - iOS Style */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
          {/* Mute */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={toggleMute}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-white' : 'bg-[#3a3a3c]'
            }`}>
              {isMuted ? (
                <MicOff className="h-6 w-6 text-black" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-white text-xs">كتم</span>
          </button>

          {/* Keypad */}
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-[#3a3a3c] flex items-center justify-center">
              <Grid3X3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">لوحة المفاتيح</span>
          </button>

          {/* Audio Output */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => setShowAudioMenu(true)}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isSpeaker ? 'bg-white' : 'bg-[#3a3a3c]'
            }`}>
              <Volume2 className={`h-6 w-6 ${isSpeaker ? 'text-black' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs">صوت</span>
          </button>

          {/* Add Call */}
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-[#3a3a3c] flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">إضافة</span>
          </button>

          {/* FaceTime / Video Toggle */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={toggleVideo}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              !isVideoOff ? 'bg-white' : 'bg-[#3a3a3c]'
            }`}>
              {isVideoOff ? (
                <VideoOff className="h-6 w-6 text-white" />
              ) : (
                <Video className="h-6 w-6 text-black" />
              )}
            </div>
            <span className="text-white text-xs">فيديو</span>
          </button>

          {/* Contacts / Switch Camera */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => {/* Switch camera */}}
          >
            <div className="w-14 h-14 rounded-full bg-[#3a3a3c] flex items-center justify-center">
              {callType === 'video' && !isVideoOff ? (
                <Camera className="h-6 w-6 text-white" />
              ) : (
                <Users className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-white text-xs">
              {callType === 'video' && !isVideoOff ? 'الكاميرا' : 'جهات الاتصال'}
            </span>
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
            onClick={onEndCall}
          >
            <PhoneOff className="h-8 w-8 text-white transform rotate-[135deg]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default OngoingCall;
