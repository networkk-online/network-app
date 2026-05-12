import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, X, Play, Pause } from 'lucide-react';

interface Props {
  isHost: boolean;
  onChange?: (state: { url: string | null; playing: boolean; t: number }) => void;
  remoteState?: { url: string | null; playing: boolean; t: number };
}

/**
 * Watch Together — host pastes/selects a Cinema video URL, viewers see it
 * full-frame while the host's camera shrinks into a PiP bubble (handled
 * by parent via `remoteState.url`).
 */
export const WatchTogetherPanel = ({ isHost, onChange, remoteState }: Props) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(remoteState?.url ?? '');

  const sync = (next: Partial<{ url: string | null; playing: boolean; t: number }>) => {
    const merged = {
      url: next.url !== undefined ? next.url : (remoteState?.url ?? url ?? null),
      playing: next.playing !== undefined ? next.playing : (remoteState?.playing ?? false),
      t: next.t !== undefined ? next.t : (remoteState?.t ?? 0),
    };
    onChange?.(merged);
  };

  if (!isHost) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute top-16 right-3 z-40 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-[#39FF14]/40 flex items-center justify-center text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]"
        title="Watch Together"
      >
        <Film className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-black/80 backdrop-blur-2xl border border-[#39FF14]/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(57,255,20,0.2)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#39FF14]" /> مشاهدة جماعية
                </h3>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="رابط فيديو من Networkk Cinema..."
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#39FF14]/60 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { sync({ url, playing: true, t: 0 }); setOpen(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#39FF14] text-black font-black text-sm shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                >
                  بث الفيديو
                </button>
                <button
                  onClick={() => { sync({ url: null, playing: false, t: 0 }); setOpen(false); }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm border border-white/10"
                >
                  إيقاف
                </button>
              </div>
              {remoteState?.url && (
                <button
                  onClick={() => sync({ playing: !remoteState.playing })}
                  className="mt-3 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs flex items-center justify-center gap-2"
                >
                  {remoteState.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {remoteState.playing ? 'إيقاف مؤقت' : 'تشغيل'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface VideoProps {
  state: { url: string | null; playing: boolean; t: number };
}
export const WatchTogetherVideo = ({ state }: VideoProps) => {
  if (!state.url) return null;
  return (
    <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
      <video
        src={state.url}
        autoPlay={state.playing}
        controls
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};
