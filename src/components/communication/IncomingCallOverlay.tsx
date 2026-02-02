import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, MessageSquare, Clock, Video, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface IncomingCallOverlayProps {
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

export const IncomingCallOverlay = ({
  caller,
  callType,
  onAccept,
  onDecline,
  onDeclineWithMessage
}: IncomingCallOverlayProps) => {
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    // Vibration pattern for incoming call
    if (navigator.vibrate) {
      const vibrateInterval = setInterval(() => {
        navigator.vibrate([200, 100, 200]);
      }, 1000);

      return () => {
        clearInterval(vibrateInterval);
        navigator.vibrate(0);
      };
    }
  }, []);

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
      {/* Blurred avatar background */}
      {caller.avatar_url && (
        <div 
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{
            backgroundImage: `url(${caller.avatar_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      <div className="h-16" />

      {/* Call Type Label */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center px-6 py-4"
      >
        <p className="text-white/70 text-sm">
          {callType === 'video' ? 'مكالمة فيديو واردة' : 'مكالمة صوتية واردة'}
        </p>
      </motion.div>

      {/* Caller Info */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Avatar className="w-28 h-28 border-4 border-white/20 shadow-2xl">
              <AvatarImage src={caller.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {caller.full_name?.charAt(0) || caller.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          {/* Pulse rings */}
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
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-1"
        >
          {caller.full_name || caller.username}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-base"
        >
          @{caller.username}
        </motion.p>
      </div>

      {/* Quick Replies Sheet */}
      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-52 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold">الرد برسالة</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQuickReplies(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
            {quickReplies.map((reply, index) => (
              <motion.button
                key={index}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="w-full text-right px-4 py-3.5 text-white transition-colors border-b border-white/5 last:border-0"
                onClick={() => handleDeclineWithMessage(reply)}
              >
                {reply}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <div className="pb-10 px-8">
        {/* Secondary Actions */}
        <div className="flex justify-center gap-12 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/80 text-xs">ذكّرني</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/80 text-xs">رسالة</span>
          </motion.button>
        </div>

        {/* Main Actions */}
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
};
