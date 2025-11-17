import { useState } from 'react';
import { Music, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MusicPickerProps {
  onMusicSelect: (music: { title: string; artist?: string; url?: string }) => void;
  onRemove?: () => void;
  currentMusic?: { title: string; artist?: string };
}

export const MusicPicker = ({ onMusicSelect, onRemove, currentMusic }: MusicPickerProps) => {
  const [musicTitle, setMusicTitle] = useState(currentMusic?.title || '');
  const [musicArtist, setMusicArtist] = useState(currentMusic?.artist || '');
  const [showInput, setShowInput] = useState(!!currentMusic);

  const handleAddMusic = () => {
    if (musicTitle.trim()) {
      onMusicSelect({ 
        title: musicTitle.trim(), 
        artist: musicArtist.trim() || undefined 
      });
      setShowInput(true);
    }
  };

  const handleRemoveMusic = () => {
    setMusicTitle('');
    setMusicArtist('');
    setShowInput(false);
    onRemove?.();
  };

  if (showInput && musicTitle) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
        <Music className="w-4 h-4 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">{musicTitle}</p>
          {musicArtist && <p className="text-xs text-gray-400">{musicArtist}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveMusic}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="اسم الأغنية..."
        value={musicTitle}
        onChange={(e) => setMusicTitle(e.target.value)}
      />
      <Input
        placeholder="اسم الفنان (اختياري)..."
        value={musicArtist}
        onChange={(e) => setMusicArtist(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddMusic}
        disabled={!musicTitle.trim()}
        className="w-full"
      >
        <Music className="w-4 h-4 mr-1" />
        إضافة موسيقى
      </Button>
    </div>
  );
};