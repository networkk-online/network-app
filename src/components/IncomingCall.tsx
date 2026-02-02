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
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
      }}
    >
      {/* Status Bar Spacer */}
      <div className="h-12" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="w-10" />
        <div className="text-center">
          <p className="text-white/70 text-sm">
            {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Caller Info - Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Avatar className="w-32 h-32 border-4 border-white/20">
              <AvatarImage src={caller.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-4 rounded-full border border-purple-400/20" />
          <div className="absolute -inset-8 rounded-full border border-purple-400/10" />
        </div>
        
        <h1 className="text-2xl font-semibold text-white mb-1">
          {caller.full_name || caller.username}
        </h1>
        <p className="text-white/60 text-base">
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
            className="absolute bottom-52 left-4 right-4 bg-[#2d1050] rounded-2xl overflow-hidden border border-purple-500/20"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-purple-500/20">
              <h3 className="text-white font-medium">الرد برسالة</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickReplies(false)}
                className="text-gray-400 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                className="w-full text-right px-4 py-3 text-white hover:bg-purple-600/30 transition-colors border-b border-purple-500/20 last:border-0"
                onClick={() => handleDeclineWithMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <div className="pb-12 px-8">
        {/* Secondary Actions */}
        <div className="flex justify-center gap-16 mb-10">
          {/* Remind Me */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => {/* TODO: Remind later */}}
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">ذكّرني</span>
          </button>

          {/* Message */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">رسالة</span>
          </button>
        </div>

        {/* Main Action Buttons */}
        <div className="flex justify-center gap-20">
          {/* Decline */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-3"
            onClick={onDecline}
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <PhoneOff className="h-8 w-8 text-white" />
            </div>
            <span className="text-white text-sm">رفض</span>
          </motion.button>

          {/* Accept */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-3"
            onClick={() => onAccept(callType)}
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              {callType === 'video' ? (
                <Video className="h-8 w-8 text-white" />
              ) : (
                <Phone className="h-8 w-8 text-white" />
              )}
            </div>
            <span className="text-white text-sm">قبول</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCall;
