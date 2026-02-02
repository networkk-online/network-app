import { useState, useEffect } from 'react';
import { PhoneOff, Phone, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface OutgoingCallProps {
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  callType: 'voice' | 'video';
  callStatus: 'initiating' | 'ringing' | 'connecting';
  onCancel: () => void;
}

const OutgoingCall = ({ participant, callType, callStatus, onCancel }: OutgoingCallProps) => {
  const isMobile = useIsMobile();
  const [dots, setDots] = useState('');

  // Animate dots for loading effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (callStatus) {
      case 'initiating':
        return 'جاري بدء المكالمة';
      case 'ringing':
        return 'جاري الرنين';
      case 'connecting':
        return 'جاري الاتصال';
      default:
        return 'جاري الاتصال';
    }
  };

  // Desktop UI
  const DesktopUI = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] hidden md:flex items-center justify-center bg-black/60 backdrop-blur-sm will-change-transform"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 will-change-transform"
        style={{
          background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center will-change-transform"
            >
              {callType === 'video' ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <Phone className="w-4 h-4 text-white" />
              )}
            </motion.div>
            <span className="text-white font-medium">
              {callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center py-12 px-8">
          {/* Avatar with pulse rings */}
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="will-change-transform"
            >
              <Avatar className="w-28 h-28 border-4 border-white/20 shadow-2xl">
                <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                  {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            {/* Pulse rings - hardware accelerated */}
            <motion.div
              animate={{ 
                scale: [1, 1.6], 
                opacity: [0.5, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
              style={{ transformOrigin: 'center' }}
            />
            <motion.div
              animate={{ 
                scale: [1, 1.9], 
                opacity: [0.3, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                delay: 0.3,
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
              style={{ transformOrigin: 'center' }}
            />
            <motion.div
              animate={{ 
                scale: [1, 2.2], 
                opacity: [0.2, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                delay: 0.6,
                ease: "easeOut"
              }}
              className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
              style={{ transformOrigin: 'center' }}
            />
          </div>

          {/* Name & Status */}
          <h2 className="text-white text-xl font-semibold mb-2">
            {participant.full_name || participant.username}
          </h2>
          <motion.p 
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/70 text-base mb-8"
          >
            {getStatusText()}{dots}
          </motion.p>

          {/* Cancel Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 will-change-transform"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
          <span className="text-white/60 text-sm mt-3">إلغاء</span>
        </div>
      </motion.div>
    </motion.div>
  );

  // Mobile UI
  const MobileUI = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] flex flex-col md:hidden will-change-transform"
      style={{
        background: 'linear-gradient(180deg, #4a1a7a 0%, #2d1050 50%, #1a0a30 100%)',
      }}
    >
      {/* Blurred avatar background */}
      {participant.avatar_url && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 blur-3xl will-change-transform"
          style={{
            backgroundImage: `url(${participant.avatar_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      <div className="h-16" />

      {/* Call Type Label */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center justify-center px-6 py-4"
      >
        <p className="text-white/70 text-sm">
          {callType === 'video' ? 'مكالمة فيديو صادرة' : 'مكالمة صوتية صادرة'}
        </p>
      </motion.div>

      {/* Caller Info */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="will-change-transform"
          >
            <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
              <AvatarImage src={participant.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-5xl bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                {participant.full_name?.charAt(0) || participant.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          {/* Pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
          />
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
          />
          <motion.div
            animate={{ scale: [1, 2.1], opacity: [0.2, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-purple-400 will-change-transform"
          />
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {participant.full_name || participant.username}
        </motion.h1>
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-white/60 text-lg"
        >
          {getStatusText()}{dots}
        </motion.p>
      </div>

      {/* Cancel Button */}
      <div className="pb-12 flex flex-col items-center">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="w-18 h-18 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 will-change-transform"
          style={{ width: 72, height: 72 }}
        >
          <PhoneOff className="h-8 w-8 text-white" />
        </motion.button>
        <span className="text-white font-medium text-sm mt-3">إلغاء المكالمة</span>
      </div>
    </motion.div>
  );

  return (
    <>
      {!isMobile && <DesktopUI />}
      {isMobile && <MobileUI />}
    </>
  );
};

export default OutgoingCall;
