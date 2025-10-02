import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  audioUrl: string;
  duration: number;
  isOwn?: boolean;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ 
  audioUrl, 
  duration,
  isOwn = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg max-w-xs ${
      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
    }`}>
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        className={`rounded-full h-8 w-8 flex-shrink-0 ${
          isOwn ? 'hover:bg-primary-foreground/10' : 'hover:bg-background/10'
        }`}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="relative h-1 bg-black/20 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-current transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs mt-1 opacity-70 font-mono">
          {formatTime(isPlaying ? currentTime : duration)}
        </div>
      </div>

      <div className="flex gap-0.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 bg-current rounded-full transition-all ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              height: isPlaying ? `${12 + Math.random() * 12}px` : '8px',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
