import { useEffect, useRef } from 'react';
import type { AgoraParticipant } from '@/hooks/useAgoraRoom';

interface AgoraVideoGridProps {
  participants: AgoraParticipant[];
}

const AgoraVideoTile = ({ participant }: { participant: AgoraParticipant }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      participant.videoTrack.play(videoRef.current);
    }
    return () => {
      participant.videoTrack?.stop();
    };
  }, [participant.videoTrack]);

  useEffect(() => {
    if (participant.audioTrack && !participant.isLocal) {
      participant.audioTrack.play();
    }
    return () => {
      if (!participant.isLocal) participant.audioTrack?.stop();
    };
  }, [participant.audioTrack, participant.isLocal]);

  return (
    <div
      ref={videoRef}
      className="w-full h-full bg-black/80 rounded-xl overflow-hidden border border-white/5"
      style={participant.isLocal ? { transform: 'scaleX(-1)' } : undefined}
    />
  );
};

export const AgoraVideoGrid = ({ participants }: AgoraVideoGridProps) => {
  const count = participants.length;

  const gridClass =
    count <= 1
      ? 'grid-cols-1 grid-rows-1'
      : count <= 2
      ? 'grid-cols-2 grid-rows-1'
      : count <= 4
      ? 'grid-cols-2 grid-rows-2'
      : 'grid-cols-3 grid-rows-2';

  return (
    <div className={`absolute inset-0 grid gap-1 p-1 ${gridClass}`}>
      {participants.map(p => (
        <AgoraVideoTile key={String(p.uid)} participant={p} />
      ))}
      {count === 0 && (
        <div className="flex items-center justify-center text-white/30 text-sm">
          بانتظار المشاركين...
        </div>
      )}
    </div>
  );
};
