import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import introVideo from '@/assets/networkk-intro.mov.asset.json';

const SESSION_KEY = 'networkk_intro_played';
const MAX_MS = 4000;

const IntroSplash = () => {
  const [shown, setShown] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY); } catch { return true; }
  });
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  const finish = () => {
    if (fading) return;
    setFading(true);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    window.setTimeout(() => setShown(false), 500);
  };

  useEffect(() => {
    if (!shown) return;
    const v = videoRef.current;
    if (!v) return;

    // Try to play unmuted first, fall back to muted if blocked
    v.muted = false;
    const playPromise = v.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        v.muted = true;
        setMuted(true);
        v.play().catch(() => finish());
      });
    }

    timerRef.current = window.setTimeout(finish, MAX_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  if (!shown) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <video
        ref={videoRef}
        src={introVideo.url}
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        className="w-full h-full object-cover"
      />
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default IntroSplash;
