import ITunesSearch, { type ITunesTrack } from '@/components/create/iTunesSearch';

export interface PickedTrack {
  title: string;
  artist?: string;
  url?: string;
  song_id?: string;
  startTime?: number;
}

interface MusicTrackPickerProps {
  onSelect: (track: PickedTrack | null) => void;
  selected?: PickedTrack | null;
}

const MusicTrackPicker = ({ onSelect, selected }: MusicTrackPickerProps) => {
  const sel: ITunesTrack | null = selected
    ? { song_id: selected.song_id || '', song_title: selected.title, artist: selected.artist || '', song_url: selected.url || '' }
    : null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-white/70">🎵 موسيقى مقترحة</p>
      <ITunesSearch
        selected={sel}
        onClear={() => onSelect(null)}
        onSelect={(t) => onSelect({ song_id: t.song_id, title: t.song_title, artist: t.artist, url: t.song_url, startTime: 0 })}
        startTime={selected?.startTime ?? 0}
        onStartTimeChange={(sec) => selected && onSelect({ ...selected, startTime: sec })}
        placeholder="ابحث عن أغنية أو فنان..."
      />
    </div>
  );
};

export default MusicTrackPicker;
