import { useState, useEffect } from 'react';
import { Phone, PhoneOff, MessageSquare, Clock, X } from 'lucide-react';
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
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 50%, #1c1c1e 100%)',
      }}
    >
      {/* Status Bar Spacer */}
      <div className="h-12" />

      {/* Header - Caller Info */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-white">
            {caller.full_name || caller.username}
          </h1>
          <p className="text-gray-400 text-base mt-1">
            {callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Avatar className="w-16 h-16 border-2 border-white/20">
            <AvatarImage src={caller.avatar_url || ''} />
            <AvatarFallback className="text-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
              {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Replies Modal */}
      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-52 left-4 right-4 bg-[#2c2c2e] rounded-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
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
                className="w-full text-right px-4 py-3 text-white hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 last:border-0"
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
            <div className="w-14 h-14 rounded-full bg-[#3a3a3c] flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs">ذكّرني</span>
          </button>

          {/* Message */}
          <button 
            className="flex flex-col items-center gap-2"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <div className="w-14 h-14 rounded-full bg-[#3a3a3c] flex items-center justify-center">
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
              <Phone className="h-8 w-8 text-white" />
            </div>
            <span className="text-white text-sm">قبول</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCall;
