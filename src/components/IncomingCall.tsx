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
        {/* Status Bar Spacer - Mobile only */}
        <div className="h-12 md:h-6" />

        {/* Header */}
        <div className="flex items-center justify-center px-6 py-4">
          <div className="text-center">
            <p className="text-white/70 text-sm md:text-base">
              {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
            </p>
          </div>
        </div>

        {/* Caller Info - Center */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-12">
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white/20 shadow-xl">
                <AvatarImage src={caller.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="text-4xl md:text-5xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                  {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute -inset-4 rounded-full border border-purple-400/20" />
            <div className="absolute -inset-8 rounded-full border border-purple-400/10" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {caller.full_name || caller.username}
          </h1>
          <p className="text-white/60 text-base md:text-lg">
            @{caller.username}
          </p>
        </div>

        {/* Quick Replies Modal */}
        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="absolute bottom-52 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[380px] bg-[#2d1050]/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl"
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

        {/* Bottom Actions */}
        <div className="pb-10 md:pb-8 px-8">
          {/* Secondary Actions */}
          <div className="flex justify-center gap-12 md:gap-16 mb-8">
            {/* Remind Me */}
            <button 
              className="flex flex-col items-center gap-2 group"
              onClick={() => {/* TODO: Remind later */}}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center backdrop-blur-sm">
                <Clock className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <span className="text-white/80 text-xs md:text-sm">ذكّرني</span>
            </button>

            {/* Message */}
            <button 
              className="flex flex-col items-center gap-2 group"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <span className="text-white/80 text-xs md:text-sm">رسالة</span>
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex justify-center gap-16 md:gap-20">
            {/* Decline */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-3"
              onClick={onDecline}
            >
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 hover:shadow-red-500/60 transition-shadow">
                <PhoneOff className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <span className="text-white font-medium text-sm">رفض</span>
            </motion.button>

            {/* Accept */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-3"
              onClick={() => onAccept(callType)}
            >
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/40 hover:shadow-green-500/60 transition-shadow">
                {callType === 'video' ? (
                  <Video className="h-7 w-7 md:h-8 md:w-8 text-white" />
                ) : (
                  <Phone className="h-7 w-7 md:h-8 md:w-8 text-white" />
                )}
              </div>
              <span className="text-white font-medium text-sm">قبول</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCall;
