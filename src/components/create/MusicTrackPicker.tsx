import ITunesSearch, { type ITunesTrack } from '@/components/create/iTunesSearch';

interface MusicTrackPickerProps {
  onSelect: (track: { title: string; artist?: string; url?: string; song_id?: string } | null) => void;
  selected?: { title: string; artist?: string; url?: string; song_id?: string } | null;
}

const MusicTrackPicker = ({ onSelect, selected }: MusicTrackPickerProps) => {
  const sel: ITunesTrack | null = selected
    ? { song_id: selected.song_id || '', song_title: selected.title, artist: selected.artist || '', song_url: selected.url || '' }
    : null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">🎵 ابحث في مكتبة الموسيقى العالمية</p>
      <ITunesSearch
        selected={sel}
        onClear={() => onSelect(null)}
        onSelect={(t) => onSelect({ song_id: t.song_id, title: t.song_title, artist: t.artist, url: t.song_url })}
      />
    </div>
  );
};

export default MusicTrackPicker;
