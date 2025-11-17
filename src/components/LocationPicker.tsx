import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  onLocationSelect: (location: { name: string; lat?: number; lng?: number }) => void;
  onRemove?: () => void;
  currentLocation?: string;
}

export const LocationPicker = ({ onLocationSelect, onRemove, currentLocation }: LocationPickerProps) => {
  const [locationName, setLocationName] = useState(currentLocation || '');
  const [showInput, setShowInput] = useState(!!currentLocation);

  const handleAddLocation = () => {
    if (locationName.trim()) {
      onLocationSelect({ name: locationName.trim() });
      setShowInput(true);
    }
  };

  const handleRemoveLocation = () => {
    setLocationName('');
    setShowInput(false);
    onRemove?.();
  };

  if (showInput && locationName) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm flex-1">{locationName}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveLocation}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="أضف موقع..."
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddLocation}
        disabled={!locationName.trim()}
      >
        <MapPin className="w-4 h-4 mr-1" />
        إضافة
      </Button>
    </div>
  );
};