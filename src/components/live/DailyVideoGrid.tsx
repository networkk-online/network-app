import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { MicOff, VideoOff, Crown } from 'lucide-react';
import type { Participant } from '@/hooks/useDailyRoom';

interface VideoTileProps {
  participant: Participant;
  className?: string;
}

const VideoTile = memo(({ participant, className = '' }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack]);
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [participant.videoTrack]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative rounded-2xl overflow-hidden bg-black/80 ${className}`}
    >
      {participant.video && participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={`w-full h-full object-cover ${participant.isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]">
          <div className="w-20 h-20 rounded-full bg-[#19e05b]/20 flex items-center justify-center">
            <span className="text-3xl font-bold text-[#19e05b]">
              {participant.user_name?.[0] || '?'}
            </span>
          </div>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1">
          {participant.isOwner && <Crown className="w-3 h-3 text-yellow-400" />}
          <span className="text-white text-xs font-medium truncate max-w-[80px]">
            {participant.isLocal ? 'أنت' : participant.user_name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!participant.audio && (
            <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          {!participant.video && (
            <div className="w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center">
              <VideoOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
VideoTile.displayName = 'VideoTile';

interface DailyVideoGridProps {
  participants: Participant[];
}

export const DailyVideoGrid = ({ participants }: DailyVideoGridProps) => {
  const count = participants.length;

  const getGridClass = () => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-2 grid-rows-1';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-3 grid-rows-2';
  };

  // If only host, show full screen
  if (count <= 1) {
    return (
      <div className="w-full h-full">
        {participants[0] && <VideoTile participant={participants[0]} className="w-full h-full rounded-none" />}
      </div>
    );
  }

  return (
    <div className={`w-full h-full grid ${getGridClass()} gap-1 p-1`}>
      {participants.map((p) => (
        <VideoTile key={p.id} participant={p} />
      ))}
    </div>
  );
};
