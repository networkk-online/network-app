import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CallPeer } from '@/hooks/useAgoraCall';

interface Props {
  peer: CallPeer;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallScreen = ({ peer, callType, onAccept, onDecline }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between overflow-hidden bg-black"
    >
      {/* Blurry avatar background */}
      {peer.avatar_url && (
        <div
          className="absolute inset-0 opacity-40 blur-3xl scale-125"
          style={{
            backgroundImage: `url(${peer.avatar_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Header label */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative mt-20 px-6 text-center"
      >
        <p className="text-sm tracking-[0.3em] uppercase text-[#00FF00]/80 font-medium">
          {callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call'}
        </p>
      </motion.div>

      {/* Caller info */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          {/* Neon pulse rings */}
          {[0, 0.4, 0.8].map((delay, i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-[#00FF00]"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Avatar className="w-36 h-36 border-4 border-[#00FF00]/60 shadow-[0_0_50px_rgba(0,255,0,0.4)]">
              <AvatarImage src={peer.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="text-5xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
                {peer.full_name?.charAt(0) || peer.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">
          {peer.full_name || peer.username}
        </h1>
        <p className="text-white/60">@{peer.username}</p>
      </div>

      {/* Action buttons */}
      <div className="relative w-full pb-14 px-10">
        <div className="flex items-end justify-between max-w-md mx-auto">
          {/* Decline */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-red-500/20 backdrop-blur-xl border border-red-500/40 shadow-[0_0_40px_rgba(255,0,40,0.5)]"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <PhoneOff className="h-7 w-7 text-white" />
              </div>
            </motion.div>
            <span className="text-white/90 text-sm font-medium">رفض</span>
          </motion.button>

          {/* Accept */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onAccept}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, delay: 0.3 }}
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[#00FF00]/20 backdrop-blur-xl border border-[#00FF00]/50 shadow-[0_0_40px_rgba(0,255,0,0.6)]"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FF00] to-emerald-600 flex items-center justify-center">
                {callType === 'video' ? (
                  <Video className="h-7 w-7 text-black" />
                ) : (
                  <Phone className="h-7 w-7 text-black" />
                )}
              </div>
            </motion.div>
            <span className="text-white/90 text-sm font-medium">قبول</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
