// Global single-audio coordinator: when one audio starts, pause all others.
type Handler = (id: string) => void;
const listeners = new Set<Handler>();
let _globalMuted = false;
const muteListeners = new Set<(m: boolean) => void>();

export const audioBus = {
  announcePlay(id: string) {
    listeners.forEach(fn => fn(id));
  },
  subscribe(fn: Handler) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  isGloballyMuted() {
    return _globalMuted;
  },
  setGlobalMuted(v: boolean) {
    _globalMuted = v;
    muteListeners.forEach(fn => fn(v));
  },
  onMuteChange(fn: (m: boolean) => void) {
    muteListeners.add(fn);
    return () => { muteListeners.delete(fn); };
  },
};
