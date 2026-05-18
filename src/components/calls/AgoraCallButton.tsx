import { Phone, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAgoraCallContext } from './AgoraCallProvider';
import type { CallPeer } from '@/hooks/useAgoraCall';

interface Props {
  peer: CallPeer;
  type?: 'voice' | 'video' | 'both';
  className?: string;
}

/**
 * Drop-in button to start an Agora call.
 * Use `type="voice"`, `"video"`, or `"both"` (renders two buttons).
 */
export const AgoraCallButton = ({ peer, type = 'both', className = '' }: Props) => {
  const { startCall, activeCall, isCallReady, sessionLoading } = useAgoraCallContext();

  const Btn = ({ kind }: { kind: 'voice' | 'video' }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      disabled={!!activeCall || !isCallReady || sessionLoading}
      onClick={() => startCall(peer, kind)}
      title={!isCallReady ? 'جاري تحميل الجلسة...' : kind === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}
      className={`h-11 w-11 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/[0.06] border border-[#00FF00]/40 text-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.25)] hover:bg-[#00FF00]/15 hover:shadow-[0_0_25px_rgba(0,255,0,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {kind === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
    </motion.button>
  );

  return (
    <div className={`flex gap-2 ${className}`}>
      {(type === 'voice' || type === 'both') && <Btn kind="voice" />}
      {(type === 'video' || type === 'both') && <Btn kind="video" />}
    </div>
  );
};
