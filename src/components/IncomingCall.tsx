import { useState, useEffect } from 'react';
import { Phone, PhoneOff, MessageSquare, Clock, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

interface IncomingCallProps {
  caller: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  callType: 'voice' | 'video';
  onAccept: (type: 'voice' | 'video') => void;
  onDecline: () => void;
  onDeclineWithMessage: (message: string) => void;
}

const quickReplies = [
  'لا أستطيع التحدث الآن',
  'سأتصل بك لاحقاً',
  'أنا في اجتماع',
  'ما الأمر؟',
];

const IncomingCall = ({ caller, callType, onAccept, onDecline, onDeclineWithMessage }: IncomingCallProps) => {
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [ringAudio] = useState(() => typeof Audio !== 'undefined' ? new Audio('/ringtone.mp3') : null);

  useEffect(() => {
    if (ringAudio) {
      ringAudio.loop = true;
      ringAudio.play().catch(() => {});
    }

    if (navigator.vibrate) {
      const vibrateInterval = setInterval(() => {
        navigator.vibrate([200, 100, 200]);
      }, 1000);

      return () => {
        clearInterval(vibrateInterval);
        if (ringAudio) {
          ringAudio.pause();
          ringAudio.currentTime = 0;
        }
        navigator.vibrate(0);
      };
    }

    return () => {
      if (ringAudio) {
        ringAudio.pause();
        ringAudio.currentTime = 0;
      }
    };
  }, [ringAudio]);

  const handleDeclineWithMessage = (message: string) => {
    onDeclineWithMessage(message);
    setShowQuickReplies(false);
  };

  // Desktop Incoming Call - Compact Window
  const DesktopIncomingCall = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] hidden md:flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div 
        className="relative w-[420px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #3d5a6c 0%, #2c4251 50%, #1e2d38 100%)',
        }}
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a252d]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400" onClick={onDecline} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/60 text-sm">
            {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
          </span>
          <button 
            onClick={onDecline}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center py-10 px-8">
          {/* Avatar with pulse */}
          <div className="relative mb-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-24 h-24 rounded-full bg-gray-600 border-4 border-gray-500 flex items-center justify-center overflow-hidden">
                {caller.avatar_url ? (
                  <img src={caller.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border-2 border-green-400/50 animate-ping" />
          </div>

          {/* Name */}
          <h2 className="text-white text-xl font-semibold mb-1">
            {caller.full_name || caller.username}
          </h2>
          <p className="text-white/60 text-sm mb-8">@{caller.username}</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Decline */}
            <button 
              onClick={onDecline}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
                <PhoneOff className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-xs">رفض</span>
            </button>

            {/* Message */}
            <button 
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-gray-600/80 hover:bg-gray-500/80 flex items-center justify-center transition-colors">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-xs">رسالة</span>
            </button>

            {/* Accept */}
            <button 
              onClick={() => onAccept(callType)}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg">
                {callType === 'video' ? (
                  <Video className="w-6 h-6 text-white" />
                ) : (
                  <Phone className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-white/70 text-xs">قبول</span>
            </button>
          </div>
        </div>

        {/* Quick Replies */}
        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] bg-gray-800/95 backdrop-blur rounded-xl overflow-hidden shadow-xl border border-gray-700"
            >
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
                <span className="text-white text-sm font-medium">الرد برسالة</span>
                <button onClick={() => setShowQuickReplies(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  className="w-full text-right px-4 py-3 text-white text-sm hover:bg-gray-700 border-b border-gray-700/50 last:border-0 transition-colors"
                  onClick={() => handleDeclineWithMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Mobile Incoming Call - Full Screen
  const MobileIncomingCall = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col md:hidden"
      style={{
        background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
      }}
    >
      <div className="h-12" />

      <div className="flex items-center justify-center px-6 py-4">
        <p className="text-white/70 text-sm">
          {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Avatar className="w-28 h-28 border-4 border-white/20 shadow-xl">
              <AvatarImage src={caller.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-1">
          {caller.full_name || caller.username}
        </h1>
        <p className="text-white/60 text-base">@{caller.username}</p>
      </div>

      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-52 left-4 right-4 bg-[#2d1050]/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-purple-500/20">
              <h3 className="text-white font-semibold">الرد برسالة</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickReplies(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                className="w-full text-right px-4 py-3.5 text-white hover:bg-purple-600/40 transition-colors border-b border-purple-500/20 last:border-0"
                onClick={() => handleDeclineWithMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-10 px-8">
        <div className="flex justify-center gap-12 mb-8">
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => {}}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/80 text-xs">ذكّرني</span>
          </button>

          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/80 text-xs">رسالة</span>
          </button>
        </div>

        <div className="flex justify-center gap-16">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3"
            onClick={onDecline}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40">
              <PhoneOff className="h-7 w-7 text-white" />
            </div>
            <span className="text-white font-medium text-sm">رفض</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3"
            onClick={() => onAccept(callType)}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40">
              {callType === 'video' ? (
                <Video className="h-7 w-7 text-white" />
              ) : (
                <Phone className="h-7 w-7 text-white" />
              )}
            </div>
            <span className="text-white font-medium text-sm">قبول</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <DesktopIncomingCall />
      <MobileIncomingCall />
    </>
  );
};

export default IncomingCall;
