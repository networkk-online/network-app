import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, MoreVertical, Camera, Monitor, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    // In native app, this would use Capacitor plugin
  };

  const switchCamera = () => {
    // Switch between front and back camera
    // In native app, this would use Capacitor plugin
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Video Area */}
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
              className="absolute top-20 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-black/50"
                onClick={() => setShowLocalVideo(false)}
              >
                <VideoOff className="h-3 w-3 text-white" />
              </Button>
            </motion.div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
          <Avatar className="w-28 h-28 border-4 border-green-500/30">
            <AvatarImage src={participant.avatar_url || ''} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-white mt-4">{participant.full_name || participant.username}</h2>
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {callType === 'video' && isVideoOff && (
            <Avatar className="w-10 h-10">
              <AvatarImage src={participant.avatar_url || ''} />
              <AvatarFallback>
                {participant.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <p className="text-white font-medium">{participant.full_name || participant.username}</p>
            <p className="text-green-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {duration}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <Users className="h-4 w-4 mr-2" />
              إضافة مشاركين
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              إرسال رسالة
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white hover:bg-gray-700">
              <Monitor className="h-4 w-4 mr-2" />
              مشاركة الشاشة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-10">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              variant={isMuted ? 'default' : 'outline'}
              className={`w-14 h-14 rounded-full ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600 border-0' 
                  : 'bg-gray-800/80 border-gray-600 hover:bg-gray-700'
              }`}
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="h-6 w-6 text-white" />
              ) : (
                <Mic className="h-6 w-6 text-white" />
              )}
            </Button>
          </motion.div>

          {/* Video Toggle */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              variant={isVideoOff ? 'default' : 'outline'}
              className={`w-14 h-14 rounded-full ${
                isVideoOff 
                  ? 'bg-gray-600 hover:bg-gray-700 border-0' 
                  : 'bg-gray-800/80 border-gray-600 hover:bg-gray-700'
              }`}
              onClick={toggleVideo}
            >
              {isVideoOff ? (
                <VideoOff className="h-6 w-6 text-white" />
              ) : (
                <Video className="h-6 w-6 text-white" />
              )}
            </Button>
          </motion.div>

          {/* End Call */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
              onClick={onEndCall}
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </Button>
          </motion.div>

          {/* Speaker */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              variant={isSpeaker ? 'default' : 'outline'}
              className={`w-14 h-14 rounded-full ${
                isSpeaker 
                  ? 'bg-blue-500 hover:bg-blue-600 border-0' 
                  : 'bg-gray-800/80 border-gray-600 hover:bg-gray-700'
              }`}
              onClick={toggleSpeaker}
            >
              <Volume2 className="h-6 w-6 text-white" />
            </Button>
          </motion.div>

          {/* Switch Camera */}
          {callType === 'video' && !isVideoOff && (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="lg"
                variant="outline"
                className="w-14 h-14 rounded-full bg-gray-800/80 border-gray-600 hover:bg-gray-700"
                onClick={switchCamera}
              >
                <Camera className="h-6 w-6 text-white" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OngoingCall;
