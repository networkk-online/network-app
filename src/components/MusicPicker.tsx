import ITunesSearch, { type ITunesTrack } from '@/components/create/iTunesSearch';

interface MusicPickerProps {
  onMusicSelect: (music: { title: string; artist?: string; url?: string }) => void;
  onRemove?: () => void;
  currentMusic?: { title: string; artist?: string; url?: string };
}

export const MusicPicker = ({ onMusicSelect, onRemove, currentMusic }: MusicPickerProps) => {
  const sel: ITunesTrack | null = currentMusic
    ? { song_id: '', song_title: currentMusic.title, artist: currentMusic.artist || '', song_url: currentMusic.url || '' }
    : null;
  return (
    <ITunesSearch
      selected={sel}
      onClear={() => onRemove?.()}
      onSelect={(t) => onMusicSelect({ title: t.song_title, artist: t.artist, url: t.song_url })}
    />
  );
};

export default MusicPicker;
