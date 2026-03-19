import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Upload, X, Scissors } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const SUGGESTED_TRACKS = [
  { id: '1', title: 'PULSE', artist: 'Slowed', url: '/music/pulse-slowed.mp4' },
  { id: '2', title: 'WHOOPS!', artist: 'Beat', url: '/music/whoops.mp4' },
  { id: '3', title: 'Skins', artist: 'Slowed Reverb', url: '/music/skins-slowed.mp4' },
  { id: '4', title: 'EMPIRE', artist: 'Ogryzek', url: '/music/empire-slowed.mp4' },
  { id: '5', title: 'Epic Montage', artist: 'حماسية', url: '/music/epic-montage.mp3' },
  { id: '6', title: 'Experience', artist: 'Einaudi', url: '/music/experience-cover.mp4' },
  { id: '7', title: 'Nightsky', artist: 'Tracey Chattaway', url: '/music/nightsky-emotional.mp4' },
  { id: '8', title: 'تاريخية', artist: 'عربية', url: '/music/arabic-historical.mp4' },
];

interface MusicTrackPickerProps {
  onSelect: (track: { title: string; artist?: string; url?: string; startTime?: number } | null) => void;
  selected?: { title: string; artist?: string; url?: string; startTime?: number } | null;
}

const MusicTrackPicker = ({ onSelect, selected }: MusicTrackPickerProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlay = (track: typeof SUGGESTED_TRACKS[0]) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.url);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(track.id);
    }
  };

  const selectTrack = (track: typeof SUGGESTED_TRACKS[0]) => {
    if (audioRef.current) { audioRef.current.pause(); setPlayingId(null); }
    onSelect({ title: track.title, artist: track.artist, url: track.url, startTime });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    const url = URL.createObjectURL(file);
    setUploadedFile(file);
    setUploadedUrl(url);
    const name = file.name.replace(/\.[^/.]+$/, '');
    onSelect({ title: name, url, startTime: 0 });
  };

  const removeUpload = () => {
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedFile(null);
    setUploadedUrl(null);
    onSelect(null);
  };

  // If already selected, show preview card
  if (selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{selected.title}</p>
            {selected.artist && <p className="text-xs text-muted-foreground">{selected.artist}</p>}
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { onSelect(null); removeUpload(); }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        {/* Start time slider */}
        <div className="flex items-center gap-3 px-1">
          <Scissors className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[selected.startTime || 0]}
            max={120}
            step={1}
            onValueChange={(v) => onSelect({ ...selected, startTime: v[0] })}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10 text-center">{selected.startTime || 0}s</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">🎵 موسيقى مقترحة</p>
        <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" onChange={handleFileUpload} className="hidden" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs gap-1 text-primary hover:text-primary/80 h-7"
        >
          <Upload className="w-3 h-3" />
          رفع صوت
        </Button>
      </div>

      {/* Uploaded file preview */}
      {uploadedFile && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Music className="w-4 h-4 text-primary" />
          <span className="text-xs text-foreground flex-1 truncate">{uploadedFile.name}</span>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={removeUpload}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Horizontal scrollable tracks */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        {SUGGESTED_TRACKS.map((track) => (
          <motion.button
            key={track.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectTrack(track)}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors min-w-[140px]"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); togglePlay(track); }}
              className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"
            >
              {playingId === track.id ? (
                <Pause className="w-3 h-3 text-primary" />
              ) : (
                <Play className="w-3 h-3 text-primary ml-0.5" />
              )}
            </motion.div>
            <div className="text-right min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{track.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default MusicTrackPicker;
