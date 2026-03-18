import { useState, useRef } from 'react';
import { Music, X, Play, Pause, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

const BUILT_IN_TRACKS: MusicTrack[] = [
  { id: '1', title: 'PULSE (Slowed)', artist: 'Unknown', url: '/music/pulse-slowed.mp4' },
  { id: '2', title: 'WHOOPS!', artist: 'Unknown', url: '/music/whoops.mp4' },
  { id: '3', title: 'EMPIRE (Slowed)', artist: 'Ogryzek', url: '/music/empire-slowed.mp4' },
  { id: '4', title: 'موسيقى حماسية للمونتاج', artist: 'Epic Montage', url: '/music/epic-montage.mp3' },
  { id: '5', title: 'موسيقى تصويرية عربية تاريخية', artist: 'Arabic Historical', url: '/music/arabic-historical.mp4' },
  { id: '6', title: 'Experience (Cover)', artist: 'Einaudi', url: '/music/experience-cover.mp4' },
];

interface MusicPickerProps {
  onMusicSelect: (music: { title: string; artist?: string; url?: string }) => void;
  onRemove?: () => void;
  currentMusic?: { title: string; artist?: string };
}

export const MusicPicker = ({ onMusicSelect, onRemove, currentMusic }: MusicPickerProps) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSelected = !!currentMusic;

  const handleSelectTrack = (track: MusicTrack) => {
    stopPlayback();
    onMusicSelect({ title: track.title, artist: track.artist, url: track.url });
    setShowLibrary(false);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleRemoveMusic = () => {
    stopPlayback();
    onRemove?.();
  };

  const togglePlayback = (track: MusicTrack) => {
    if (playingId === track.id) {
      stopPlayback();
    } else {
      stopPlayback();
      const audio = new Audio(track.url);
      audio.volume = 0.4;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlayingId(track.id);
      audio.onended = () => setPlayingId(null);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  const handleAddCustom = () => {
    if (customTitle.trim()) {
      onMusicSelect({ title: customTitle.trim() });
      setCustomTitle('');
      setShowLibrary(false);
    }
  };

  if (isSelected && !showLibrary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 rounded-xl border border-primary/20"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))' }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Music className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{currentMusic?.title}</p>
          {currentMusic?.artist && <p className="text-[10px] text-muted-foreground">{currentMusic.artist}</p>}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={handleRemoveMusic} className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {!showLibrary ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLibrary(true)}
          className="w-full gap-2 border-border/30 bg-muted/10 hover:bg-primary/10 hover:border-primary/30 transition-all"
        >
          <Music className="w-4 h-4 text-primary" />
          إضافة موسيقى
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border/30 overflow-hidden"
            style={{ background: 'rgba(15,15,25,0.6)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
              <span className="text-xs font-bold text-foreground">🎵 مكتبة الموسيقى</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => { setShowLibrary(false); stopPlayback(); }} className="h-6 w-6 text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Built-in Tracks */}
            <div className="max-h-[240px] overflow-y-auto">
              {BUILT_IN_TRACKS.map((track, index) => (
                <motion.button
                  key={track.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 transition-colors text-right"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePlayback(track); }}
                    className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 hover:bg-primary/25 transition-colors"
                  >
                    {playingId === track.id ? (
                      <Pause className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-[10px] text-muted-foreground">{track.artist}</p>
                  </div>
                  {currentMusic?.title === track.title && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Custom entry */}
            <div className="p-3 border-t border-border/20">
              <p className="text-[10px] text-muted-foreground mb-1.5">أو أدخل اسم أغنية يدوياً</p>
              <div className="flex gap-2">
                <Input
                  placeholder="اسم الأغنية..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="h-8 text-xs bg-background/50 border-border/30"
                />
                <Button type="button" size="sm" onClick={handleAddCustom} disabled={!customTitle.trim()} className="h-8 text-xs px-3">
                  إضافة
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
