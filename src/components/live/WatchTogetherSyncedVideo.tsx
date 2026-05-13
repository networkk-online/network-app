import { useEffect, useRef } from 'react';
import { useWatchTogetherSync } from '@/hooks/useWatchTogetherSync';

interface Props {
  state: { url: string | null; playing: boolean; t: number };
  channelName: string | null;
  isHost: boolean;
}

/**
 * Drop-in player that owns its <video> ref and wires Realtime sync.
 * - Host: emits state every 2s + on play/pause/seek.
 * - Viewer: snaps to host time when drift > 1.5s.
 */
export const WatchTogetherSyncedVideo = ({ state, channelName, isHost }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);

  useWatchTogetherSync({
    channelName,
    isHost,
    videoEl: ref.current,
  });

  // When host changes URL/play state via panel, push to <video>
  useEffect(() => {
    const v = ref.current;
    if (!v || !isHost) return;
    if (state.url && v.src !== state.url) v.src = state.url;
    if (state.playing && v.paused) v.play().catch(() => {});
    if (!state.playing && !v.paused) v.pause();
  }, [state.url, state.playing, isHost]);

  if (!state.url) return null;

  return (
    <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
      <video
        ref={ref}
        src={state.url}
        autoPlay={state.playing}
        controls={isHost}
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};
