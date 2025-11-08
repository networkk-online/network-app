import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface VideoEditorProps {
  videoUrl: string;
  onApplyFilters: (editedVideo: Blob) => void;
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  blur: number;
}

export const VideoEditor = ({ videoUrl, onApplyFilters }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    blur: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const updateFilter = (key: keyof Filters, value: number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFiltersToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', applyFiltersToCanvas);
      video.addEventListener('seeked', applyFiltersToCanvas);
      return () => {
        video.removeEventListener('loadeddata', applyFiltersToCanvas);
        video.removeEventListener('seeked', applyFiltersToCanvas);
      };
    }
  }, [filters]);

  const handleApply = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsProcessing(true);

    try {
      // Create a stream from canvas
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onApplyFilters(blob);
        setIsProcessing(false);
      };

      // Start recording
      mediaRecorder.start();
      video.currentTime = 0;
      video.play();

      video.onended = () => {
        mediaRecorder.stop();
        video.pause();
      };
    } catch (error) {
      console.error('Error processing video:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[400px] object-contain"
          style={{
            filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`,
          }}
          muted
          loop
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="space-y-4 p-4 bg-card rounded-lg border">
        <div>
          <Label className="text-sm font-medium">السطوع</Label>
          <Slider
            value={[filters.brightness]}
            onValueChange={([value]) => updateFilter('brightness', value)}
            min={50}
            max={150}
            step={1}
            className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{filters.brightness}%</span>
        </div>

        <div>
          <Label className="text-sm font-medium">التباين</Label>
          <Slider
            value={[filters.contrast]}
            onValueChange={([value]) => updateFilter('contrast', value)}
            min={50}
            max={150}
            step={1}
            className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{filters.contrast}%</span>
        </div>

        <div>
          <Label className="text-sm font-medium">التشبع</Label>
          <Slider
            value={[filters.saturation]}
            onValueChange={([value]) => updateFilter('saturation', value)}
            min={0}
            max={200}
            step={1}
            className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{filters.saturation}%</span>
        </div>

        <div>
          <Label className="text-sm font-medium">فلتر سيبيا</Label>
          <Slider
            value={[filters.sepia]}
            onValueChange={([value]) => updateFilter('sepia', value)}
            min={0}
            max={100}
            step={1}
            className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{filters.sepia}%</span>
        </div>

        <div>
          <Label className="text-sm font-medium">التمويه</Label>
          <Slider
            value={[filters.blur]}
            onValueChange={([value]) => updateFilter('blur', value)}
            min={0}
            max={10}
            step={0.1}
            className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{filters.blur}px</span>
        </div>

        <Button
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'جاري المعالجة...' : 'تطبيق الفلاتر'}
        </Button>
      </div>
    </div>
  );
};
