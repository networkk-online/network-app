import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WTState {
  url: string | null;
  playing: boolean;
  t: number;
  updated_at: number; // ms epoch
}

/**
 * Watch Together sync via Supabase Realtime broadcast.
 * - Host emits state on every change + heartbeat every 2s while playing.
 * - Viewers seek if drift > 1.5s; pause/play follows host.
 */
export function useWatchTogetherSync(opts: {
  channelName: string | null;
  isHost: boolean;
  videoEl: HTMLVideoElement | null;
  onRemoteState?: (s: WTState) => void;
}) {
  const { channelName, isHost, videoEl, onRemoteState } = opts;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastEmittedRef = useRef<string>('');

  const emit = useCallback((s: WTState) => {
    const ch = channelRef.current;
    if (!ch) return;
    const sig = `${s.url}|${s.playing}|${Math.round(s.t)}`;
    if (sig === lastEmittedRef.current) return;
    lastEmittedRef.current = sig;
    ch.send({ type: 'broadcast', event: 'wt_state', payload: s });
  }, []);

  // Subscribe
  useEffect(() => {
    if (!channelName) return;
    const ch = supabase.channel(`wt:${channelName}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('broadcast', { event: 'wt_state' }, (msg) => {
      const s = msg.payload as WTState;
      onRemoteState?.(s);

      // Viewer-side application
      if (!isHost && videoEl) {
        if (s.url && videoEl.src !== s.url) videoEl.src = s.url;
        if (s.playing && videoEl.paused) videoEl.play().catch(() => {});
        if (!s.playing && !videoEl.paused) videoEl.pause();
        // Compensate for transport latency
        const latency = (Date.now() - s.updated_at) / 1000;
        const target = s.t + (s.playing ? latency : 0);
        if (Math.abs((videoEl.currentTime || 0) - target) > 1.5) {
          try { videoEl.currentTime = target; } catch {}
        }
      }
    });

    ch.subscribe();
    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [channelName, isHost, videoEl, onRemoteState]);

  // Host heartbeat
  useEffect(() => {
    if (!isHost || !videoEl) return;
    const tick = () => {
      if (!videoEl) return;
      emit({
        url: videoEl.currentSrc || null,
        playing: !videoEl.paused,
        t: videoEl.currentTime || 0,
        updated_at: Date.now(),
      });
    };
    heartbeatRef.current = window.setInterval(tick, 2000) as unknown as number;
    const onPlay = () => tick();
    const onPause = () => tick();
    const onSeek = () => tick();
    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('seeked', onSeek);
    return () => {
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('seeked', onSeek);
    };
  }, [isHost, videoEl, emit]);

  return { emit };
}
