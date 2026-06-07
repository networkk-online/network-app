import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Music } from 'lucide-react';

interface PostMusicBarProps {
  title: string;
  artist?: string | null;
  url?: string | null;
}

const PostMusicBar = ({ title, artist, url }: PostMusicBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <div className="mx-4 my-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        className="w-9 h-9 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
      >
        {playing ? (
          <Pause className="w-4 h-4 text-primary" />
        ) : (
          <Play className="w-4 h-4 text-primary ml-0.5" />
        )}
      </button>
      <Music className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/90 font-medium truncate">{title}</p>
        {artist && <p className="text-[11px] text-white/40 truncate">{artist}</p>}
      </div>
    </div>
  );
};

export default PostMusicBar;
