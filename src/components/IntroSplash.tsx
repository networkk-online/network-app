import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import introVideo from '@/assets/networkk-intro.mp4.asset.json';
import { hasCachedSession } from '@/lib/authBoot';

const SESSION_KEY = 'networkk_intro_played';
const MAX_MS = 4000;

const IntroSplash = () => {
  const [shown, setShown] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY); } catch { return true; }
  });
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Decide the destination synchronously at mount — no network round-trip.
  const routeAfterIntro = () => {
    const path = location.pathname;
    if (path !== '/' && path !== '') return; // never hijack deep links
    if (!hasCachedSession()) navigate('/login', { replace: true });
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    setFading(true);
    routeAfterIntro();
    window.setTimeout(() => setShown(false), 300);
  };

  // Route immediately on first paint so the correct screen is already mounted
  // behind the splash — no blank frame when the intro fades out.
  useEffect(() => {
    if (!shown) return;
    routeAfterIntro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!shown) return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = false;
    v.volume = 1;

    const tryUnmute = () => { v.muted = false; v.volume = 1; };

    const playPromise = v.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {
        v.muted = true;
        v.play().catch(() => finish());
        const unlock = () => {
          tryUnmute();
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      });
    }

    timerRef.current = window.setTimeout(finish, MAX_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  if (!shown) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-300 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={finish}
    >
      <video
        ref={videoRef}
        src={introVideo.url}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onEnded={finish}
        onError={finish}
        onStalled={finish}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default IntroSplash;
