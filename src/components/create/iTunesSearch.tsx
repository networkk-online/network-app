import { useEffect, useRef, useState } from 'react';
import { Search, Play, Pause, Music, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export interface ITunesTrack {
  song_id: string;
  song_title: string;
  artist: string;
  artwork?: string;
  song_url: string;
}

interface RawTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

interface Props {
  onSelect: (track: ITunesTrack) => void;
  selected?: ITunesTrack | null;
  onClear?: () => void;
  placeholder?: string;
}

const ITunesSearch = ({ onSelect, selected, onClear, placeholder = 'ابحث عن أغنية (iTunes)...' }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ITunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; }, []);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!query.trim() || selected) { setResults([]); return; }
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`);
        const data = await res.json();
        const tracks: ITunesTrack[] = (data.results as RawTrack[])
          .filter(t => t.previewUrl)
          .map(t => ({
            song_id: String(t.trackId),
            song_title: t.trackName,
            artist: t.artistName,
            artwork: t.artworkUrl100?.replace('100x100', '200x200'),
            song_url: t.previewUrl!,
          }));
        setResults(tracks);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query, selected]);

  const togglePreview = (t: ITunesTrack) => {
    if (previewId === t.song_id) {
      audioRef.current?.pause();
      setPreviewId(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio();
    a.crossOrigin = 'anonymous';
    a.preload = 'auto';
    a.src = t.song_url;
    a.onended = () => setPreviewId(null);
    a.onerror = () => setPreviewId(null);
    a.play().catch(() => setPreviewId(null));
    audioRef.current = a;
    setPreviewId(t.song_id);
  };

  const pick = (t: ITunesTrack) => {
    audioRef.current?.pause();
    setPreviewId(null);
    setQuery('');
    setResults([]);
    onSelect(t);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-primary/60 ring-1 ring-primary/30">
        {selected.artwork ? (
          <img src={selected.artwork} alt="" className="w-10 h-10 rounded-md object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{selected.song_title}</p>
          <p className="text-xs text-muted-foreground truncate">{selected.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => { audioRef.current?.pause(); onClear?.(); }}
          aria-label="إزالة الأغنية"
          className="w-8 h-8 rounded-full hover:bg-white/[0.08] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-9 bg-white/[0.04] border-white/[0.06] focus-visible:ring-primary/40"
        />
      </div>
      {loading && (
        <div className="flex items-center justify-center py-3 text-xs text-muted-foreground gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري البحث...
        </div>
      )}
      {results.length > 0 && (
        <div className="max-h-72 overflow-y-auto space-y-1.5 scrollbar-hide rounded-xl bg-black/30 p-2 border border-white/[0.05]">
          {results.map(t => (
            <motion.div
              key={t.song_id}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              onClick={() => pick(t)}
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                {t.artwork ? (
                  <img src={t.artwork} alt="" className="w-11 h-11 rounded-md object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-primary/15 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePreview(t); }}
                  aria-label={previewId === t.song_id ? 'إيقاف' : 'تشغيل'}
                  className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center"
                >
                  {previewId === t.song_id
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white ml-0.5" />}
                </button>
                {previewId === t.song_id && (
                  <div className="absolute inset-0 bg-black/45 rounded-md flex items-center justify-center pointer-events-none">
                    <Pause className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-sm font-medium text-foreground truncate">{t.song_title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ITunesSearch;
