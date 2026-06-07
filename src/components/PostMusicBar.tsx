import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music2 } from 'lucide-react';
import { audioBus } from '@/lib/audioBus';

interface PostMusicBarProps {
  title: string;
  artist?: string | null;
  url?: string | null;
  /** when true, render as Instagram-style absolute overlay on image */
  overlay?: boolean;
  postId?: string;
  /** seconds into the song where playback should start */
  startTime?: number;
}

const PostMusicBar = ({ title, artist, url, overlay = false, postId, startTime = 0 }: PostMusicBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef<string>(postId || Math.random().toString(36).slice(2));
  const [playing, setPlaying] = useState(false);

  const ensureAudio = () => {
    if (!url) return null;
    if (!audioRef.current) {
      const a = new Audio();
      a.crossOrigin = 'anonymous';
      a.preload = 'auto';
      a.loop = true;
      a.src = url;
      const seek = () => {
        try { if (startTime > 0) a.currentTime = startTime; } catch {}
      };
      a.onloadedmetadata = seek;
      a.onended = () => setPlaying(false);
      a.onerror = () => setPlaying(false);
      audioRef.current = a;
    }
    return audioRef.current;
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = '';
      audioRef.current = null;
    };
  }, []);

  // Reset audio object when url changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
      setPlaying(false);
    }
  }, [url]);

  // Pause when another audio announces play
  useEffect(() => {
    return audioBus.subscribe((sourceId) => {
      if (sourceId !== idRef.current && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlaying(false);
      }
    });
  }, []);

  const toggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!url) return;
    const a = ensureAudio();
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      audioBus.announcePlay(idRef.current);
      try { if (startTime > 0 && Math.abs(a.currentTime - startTime) > 0.5) a.currentTime = startTime; } catch {}
      const p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setPlaying(true)).catch((err) => {
          console.warn('Audio playback blocked:', err);
          setPlaying(false);
        });
      } else {
        setPlaying(true);
      }
    }
  };

  const label = artist ? `${title} • ${artist}` : title;

  if (overlay) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/[0.08] text-white max-w-[80%] disabled:opacity-60"
        style={{ width: 'fit-content' }}
      >
        <span className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
          <Music2 className={`w-3.5 h-3.5 ${playing ? 'text-primary animate-pulse' : 'text-white/80'}`} />
        </span>
        <div className="overflow-hidden max-w-[180px] sm:max-w-[260px]">
          <div className={`whitespace-nowrap text-[11px] font-medium ${playing && label.length > 28 ? 'animate-[marquee_12s_linear_infinite]' : ''}`}>
            {label}
          </div>
        </div>
        {url && (
          <span className="ml-1 flex items-center justify-center w-4 h-4 flex-shrink-0">
            {playing ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-white/70" />}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="mx-4 my-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        className="w-9 h-9 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
      >
        {playing ? <Volume2 className="w-4 h-4 text-primary" /> : <Music2 className="w-4 h-4 text-primary" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/90 font-medium truncate">{title}</p>
        {artist && <p className="text-[11px] text-white/40 truncate">{artist}</p>}
      </div>
    </div>
  );
};

export default PostMusicBar;
