import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Play, 
  Pause, 
  Music, 
  TrendingUp, 
  Sparkles,
  Clock,
  Scissors,
  Check,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
  previewUrl: string;
  isIraqi?: boolean;
}

interface IraqiMusicLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (song: { title: string; artist: string; url?: string; startTime?: number; endTime?: number }) => void;
}

// Sample audio URLs for demo (royalty-free music)
const SAMPLE_AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
];

// Iraqi Songs Database
const IRAQI_SONGS: Song[] = [
  { id: '1', title: 'ماكو منك', artist: 'سيف نبيل', cover: '🇮🇶', duration: 245, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[0] },
  { id: '2', title: 'يمه', artist: 'محمود التركي', cover: '🇮🇶', duration: 198, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[1] },
  { id: '3', title: 'غريبة الناس', artist: 'أصيل هميم', cover: '🇮🇶', duration: 267, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[2] },
  { id: '4', title: 'حب جنون', artist: 'سيف نبيل', cover: '🇮🇶', duration: 223, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[3] },
  { id: '5', title: 'مو مستاهل', artist: 'نور الزين', cover: '🇮🇶', duration: 234, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[4] },
  { id: '6', title: 'ابن الوفه', artist: 'علي صابر', cover: '🇮🇶', duration: 256, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[5] },
  { id: '7', title: 'روحي', artist: 'كاظم الساهر', cover: '🇮🇶', duration: 312, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[0] },
  { id: '8', title: 'قولي أحبك', artist: 'حسام الرسام', cover: '🇮🇶', duration: 278, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[1] },
  { id: '9', title: 'حلوة يا بلدي', artist: 'ماجد المهندس', cover: '🇮🇶', duration: 245, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[2] },
  { id: '10', title: 'يا ناس', artist: 'وليد الشامي', cover: '🇮🇶', duration: 189, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[3] },
  { id: '11', title: 'شكد كلبك', artist: 'محمد السالم', cover: '🇮🇶', duration: 234, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[4] },
  { id: '12', title: 'أحبك موت', artist: 'رحمة رياض', cover: '🇮🇶', duration: 267, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[5] },
];

// Global Trending Songs
const GLOBAL_SONGS: Song[] = [
  { id: 'g1', title: 'Flowers', artist: 'Miley Cyrus', cover: '🌸', duration: 200, previewUrl: SAMPLE_AUDIO_URLS[0] },
  { id: 'g2', title: 'Kill Bill', artist: 'SZA', cover: '⚔️', duration: 195, previewUrl: SAMPLE_AUDIO_URLS[1] },
  { id: 'g3', title: 'Shakira', artist: 'Bzrp Session', cover: '🎤', duration: 210, previewUrl: SAMPLE_AUDIO_URLS[2] },
  { id: 'g4', title: 'Calm Down', artist: 'Rema & Selena', cover: '🎵', duration: 234, previewUrl: SAMPLE_AUDIO_URLS[3] },
  { id: 'g5', title: 'Anti-Hero', artist: 'Taylor Swift', cover: '⭐', duration: 201, previewUrl: SAMPLE_AUDIO_URLS[4] },
  { id: 'g6', title: 'Unholy', artist: 'Sam Smith', cover: '🔥', duration: 189, previewUrl: SAMPLE_AUDIO_URLS[5] },
  { id: 'g7', title: 'As It Was', artist: 'Harry Styles', cover: '💜', duration: 167, previewUrl: SAMPLE_AUDIO_URLS[0] },
  { id: 'g8', title: 'Blinding Lights', artist: 'The Weeknd', cover: '🌃', duration: 203, previewUrl: SAMPLE_AUDIO_URLS[1] },
];

// New Releases
const NEW_RELEASES: Song[] = [
  { id: 'n1', title: 'جديد 2024', artist: 'سيف نبيل', cover: '✨', duration: 245, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[2] },
  { id: 'n2', title: 'حصري', artist: 'محمود التركي', cover: '🔥', duration: 198, isIraqi: true, previewUrl: SAMPLE_AUDIO_URLS[3] },
  { id: 'n3', title: 'New Single', artist: 'Global Artist', cover: '🎤', duration: 210, previewUrl: SAMPLE_AUDIO_URLS[4] },
  { id: 'n4', title: 'Fresh Drop', artist: 'Popular DJ', cover: '🎧', duration: 234, previewUrl: SAMPLE_AUDIO_URLS[5] },
];

export const IraqiMusicLibrary = ({ isOpen, onClose, onSelect }: IraqiMusicLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSong, setPlayingSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 15]);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Cleanup audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle audio playback state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && playingSong) {
        audioRef.current.volume = volume;
        audioRef.current.play().catch(error => {
          console.log("Playback failed", error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume]);

  // Update audio time
  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
        // Loop within trim range
        if (audioRef.current && audioRef.current.currentTime >= trimRange[1]) {
          audioRef.current.currentTime = trimRange[0];
        }
      };
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [trimRange]);

  // Filter songs based on search
  const filterSongs = (songs: Song[]) => {
    if (!searchQuery.trim()) return songs;
    const query = searchQuery.toLowerCase();
    return songs.filter(
      song => 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query)
    );
  };

  // Play/Pause song preview
  const togglePlay = async (song: Song) => {
    initAudioContext();
    
    if (playingSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setIsLoading(true);
      setPlayingSong(song);
      
      // Create new audio element
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(song.previewUrl);
      audio.volume = volume;
      audio.crossOrigin = 'anonymous';
      
      audio.oncanplaythrough = () => {
        setIsLoading(false);
        audio.play().catch(error => {
          console.log("Playback failed", error);
          setIsLoading(false);
        });
      };
      
      audio.onerror = () => {
        console.log("Audio load error");
        setIsLoading(false);
      };
      
      audioRef.current = audio;
      setIsPlaying(true);
      setTrimRange([0, Math.min(15, song.duration)]);
    }
  };

  // Select song and open trimmer
  const selectSong = async (song: Song) => {
    initAudioContext();
    setPlayingSong(song);
    setShowTrimmer(true);
    setTrimRange([0, Math.min(60, song.duration)]);
    
    // Load audio for preview
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(song.previewUrl);
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    audio.oncanplaythrough = () => {
      setIsLoading(false);
    };
    
    audio.onerror = () => {
      console.log("Audio load error");
      setIsLoading(false);
    };
    
    audioRef.current = audio;
  };

  // Confirm selection
  const confirmSelection = () => {
    if (playingSong) {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      onSelect({
        title: playingSong.title,
        artist: playingSong.artist,
        url: playingSong.previewUrl,
        startTime: trimRange[0],
        endTime: trimRange[1]
      });
      onClose();
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const SongCard = ({ song }: { song: Song }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
        "hover:bg-white/10 active:scale-[0.98]",
        playingSong?.id === song.id && "bg-primary/20 border border-primary/30"
      )}
      onClick={() => selectSong(song)}
    >
      {/* Cover */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
        {song.cover}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white truncate">{song.title}</h4>
        <p className="text-sm text-gray-400 truncate flex items-center gap-1">
          {song.artist}
          {song.isIraqi && <span className="text-xs">🇮🇶</span>}
        </p>
        <p className="text-xs text-gray-500">{formatTime(song.duration)}</p>
      </div>

      {/* Play button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay(song);
        }}
        disabled={isLoading && playingSong?.id === song.id}
        className={cn(
          "w-10 h-10 rounded-full transition-all",
          playingSong?.id === song.id && isPlaying 
            ? "bg-primary text-primary-foreground" 
            : "bg-white/10 text-white"
        )}
      >
        {isLoading && playingSong?.id === song.id ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : playingSong?.id === song.id && isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </Button>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 h-[85vh] bg-gradient-to-b from-gray-900 to-black rounded-t-3xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">إضافة صوت</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-6 h-6 text-white" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أغنية..."
                className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-gray-400 rounded-xl"
              />
            </div>
          </div>

          {/* Content */}
          {!showTrimmer ? (
            <Tabs defaultValue="iraqi" className="flex-1">
              <TabsList className="w-full justify-start gap-2 bg-transparent p-4 h-auto">
                <TabsTrigger 
                  value="iraqi"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4"
                >
                  🇮🇶 اغاني عراقية
                </TabsTrigger>
                <TabsTrigger 
                  value="trending"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  رائج عالمياً
                </TabsTrigger>
                <TabsTrigger 
                  value="new"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  جديد
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 h-[calc(85vh-200px)]">
                <TabsContent value="iraqi" className="px-4 pb-20 space-y-2 mt-0">
                  {filterSongs(IRAQI_SONGS).map(song => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </TabsContent>

                <TabsContent value="trending" className="px-4 pb-20 space-y-2 mt-0">
                  {filterSongs(GLOBAL_SONGS).map(song => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </TabsContent>

                <TabsContent value="new" className="px-4 pb-20 space-y-2 mt-0">
                  {filterSongs(NEW_RELEASES).map(song => (
                    <SongCard key={song.id} song={song} />
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          ) : (
            /* Audio Trimmer */
            <div className="p-4 flex flex-col h-[calc(85vh-100px)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTrimmer(false)}
                className="self-start mb-4 text-gray-400"
              >
                ← الرجوع
              </Button>

              {/* Selected song info */}
              {playingSong && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl shadow-xl">
                    {playingSong.cover}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{playingSong.title}</h3>
                    <p className="text-gray-400">{playingSong.artist}</p>
                  </div>
                </div>
              )}

              {/* Waveform visualization (placeholder) */}
              <div className="relative h-24 bg-white/5 rounded-xl mb-4 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 rounded-full transition-all",
                        i >= (trimRange[0] / (playingSong?.duration || 100)) * 60 &&
                        i <= (trimRange[1] / (playingSong?.duration || 100)) * 60
                          ? "bg-primary"
                          : "bg-white/20"
                      )}
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>

                {/* Trim overlay */}
                <div 
                  className="absolute top-0 bottom-0 bg-primary/20 border-x-2 border-primary"
                  style={{
                    left: `${(trimRange[0] / (playingSong?.duration || 100)) * 100}%`,
                    right: `${100 - (trimRange[1] / (playingSong?.duration || 100)) * 100}%`
                  }}
                />
              </div>

              {/* Trim controls */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-4 h-4" />
                    قص المقطع
                  </span>
                  <span className="text-primary font-mono">
                    {formatTime(trimRange[1] - trimRange[0])} ثانية
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>البداية: {formatTime(trimRange[0])}</span>
                    <span>النهاية: {formatTime(trimRange[1])}</span>
                  </div>
                  <Slider
                    value={trimRange}
                    min={0}
                    max={playingSong?.duration || 100}
                    step={1}
                    onValueChange={(value) => setTrimRange(value as [number, number])}
                    className="w-full"
                  />
                </div>

                <p className="text-xs text-gray-500 text-center">
                  الحد الأقصى: 60 ثانية للستوري
                </p>
              </div>

              {/* Volume control */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
                <Volume2 className="w-5 h-5 text-gray-400" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
                <span className="text-sm text-gray-400 w-12 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Preview button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  initAudioContext();
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.currentTime = trimRange[0];
                      audioRef.current.play().catch(e => console.log("Playback failed", e));
                    }
                    setIsPlaying(!isPlaying);
                  }
                }}
                disabled={isLoading}
                className="w-full mb-4 border-white/20 text-white"
              >
                {isLoading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> جاري التحميل...</>
                ) : isPlaying ? (
                  <><Pause className="w-5 h-5 mr-2" /> إيقاف المعاينة</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> معاينة المقطع</>
                )}
              </Button>

              {/* Confirm button */}
              <Button
                size="lg"
                onClick={confirmSelection}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Check className="w-5 h-5 mr-2" />
                استخدام هذا المقطع
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
