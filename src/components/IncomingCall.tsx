import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, MessageSquare, X } from 'lucide-react';
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
    // Play ringtone
    if (ringAudio) {
      ringAudio.loop = true;
      ringAudio.play().catch(() => {});
    }

    // Vibrate if supported
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

  const handleDecline = () => {
    onDecline();
  };

  const handleDeclineWithMessage = (message: string) => {
    onDeclineWithMessage(message);
    setShowQuickReplies(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-between p-8"
    >
      {/* Caller Info */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
          <Avatar className="w-32 h-32 border-4 border-green-500/50">
            <AvatarImage src={caller.avatar_url || ''} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mt-6">{caller.full_name || caller.username}</h2>
        <p className="text-green-400 mt-2 flex items-center gap-2">
          {callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
        </p>

        <motion.p
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-gray-400 mt-4"
        >
          جارٍ الرنين...
        </motion.p>
      </div>

      {/* Quick Replies */}
      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-40 left-4 right-4 bg-gray-800/90 rounded-2xl p-4 space-y-2"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-medium">رد سريع</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickReplies(false)}
                className="text-gray-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-white border-gray-600 hover:bg-gray-700"
                onClick={() => handleDeclineWithMessage(reply)}
              >
                {reply}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="space-y-4 w-full max-w-sm">
        {/* Accept Buttons */}
        <div className="flex justify-center gap-6">
          {/* Accept Voice */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
              onClick={() => onAccept('voice')}
            >
              <Phone className="h-7 w-7 text-white" />
            </Button>
          </motion.div>

          {/* Accept Video (if video call) */}
          {callType === 'video' && (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="lg"
                className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                onClick={() => onAccept('video')}
              >
                <Video className="h-7 w-7 text-white" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Decline Buttons */}
        <div className="flex justify-center gap-4">
          {/* Quick Reply */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full border-gray-600 text-white hover:bg-gray-800"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Decline */}
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="lg"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
              onClick={handleDecline}
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCall;
