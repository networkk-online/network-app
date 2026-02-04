import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Zap, 
  ZapOff, 
  Image as ImageIcon, 
  Video, 
  Circle,
  Check,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StoryCameraCaptureProps {
  onCapture: (file: File, type: 'image' | 'video') => void;
  onClose: () => void;
  isOpen: boolean;
}

export const StoryCameraCapture = ({ onCapture, onClose, isOpen }: StoryCameraCaptureProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'image' | 'video'; file: File } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Apply flash (torch) if supported
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();
      if (capabilities && 'torch' in capabilities) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: flashEnabled } as any]
          });
        } catch (e) {
          console.log('Torch not supported');
        }
      }

      setCameraReady(true);
      setHasPermission(true);
    } catch (error: any) {
      console.error('Camera error:', error);
      setHasPermission(false);
      toast({
        title: 'خطأ في الكاميرا',
        description: error.name === 'NotAllowedError' 
          ? 'يرجى السماح بالوصول للكاميرا' 
          : 'تعذر تشغيل الكاميرا',
        variant: 'destructive'
      });
    }
  }, [facingMode, flashEnabled, toast]);

  useEffect(() => {
    if (isOpen) {
      initCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isOpen, initCamera]);

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Toggle flash
  const toggleFlash = async () => {
    setFlashEnabled(!flashEnabled);
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
      } catch (e) {
        toast({
          title: 'الفلاش غير مدعوم',
          description: 'جهازك لا يدعم ميزة الفلاش',
          variant: 'destructive'
        });
      }
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedMedia({
          url: URL.createObjectURL(blob),
          type: 'image',
          file
        });

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 'image/jpeg', 0.9);
  };

  // Start video recording
  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    const options = { mimeType: 'video/webm;codecs=vp9' };
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    } catch {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      setCapturedMedia({
        url: URL.createObjectURL(blob),
        type: 'video',
        file
      });
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingDuration(0);

    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= 60) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(100);
  };

  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Handle record button (tap = photo, hold = video)
  const handleRecordStart = () => {
    startRecording();
  };

  const handleRecordEnd = () => {
    if (isRecording && recordingDuration < 1) {
      // Short press = photo
      stopRecording();
      capturePhoto();
    } else if (isRecording) {
      stopRecording();
    }
  };

  // Use captured media
  const useCapturedMedia = () => {
    if (capturedMedia) {
      onCapture(capturedMedia.file, capturedMedia.type);
      setCapturedMedia(null);
    }
  };

  // Discard and retake
  const retake = () => {
    if (capturedMedia?.url) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    setCapturedMedia(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Permission request screen */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
            <Camera className="w-16 h-16 mb-4 text-gray-400" />
            <h3 className="text-xl font-bold mb-2">إذن الكاميرا مطلوب</h3>
            <p className="text-gray-400 text-center mb-4 px-8">
              يرجى السماح بالوصول إلى الكاميرا والميكروفون لالتقاط الصور والفيديو
            </p>
            <Button onClick={initCamera} className="bg-primary">
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Camera preview */}
        {!capturedMedia ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "absolute inset-0 w-full h-full object-cover",
                facingMode === 'user' && "scale-x-[-1]"
              )}
            />

            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFlash}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  {flashEnabled ? <Zap className="w-6 h-6 text-yellow-400" /> : <ZapOff className="w-6 h-6" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <RefreshCw className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-white font-bold">{formatDuration(recordingDuration)}</span>
                </div>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-center gap-8">
                {/* Gallery button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => document.getElementById('gallery-input')?.click()}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white"
                >
                  <ImageIcon className="w-6 h-6" />
                </Button>

                {/* Capture button */}
                <motion.button
                  onMouseDown={handleRecordStart}
                  onMouseUp={handleRecordEnd}
                  onTouchStart={handleRecordStart}
                  onTouchEnd={handleRecordEnd}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all",
                    isRecording ? "bg-red-500 scale-110" : "bg-white/20"
                  )}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 bg-white rounded-sm" />
                  ) : (
                    <Circle className="w-16 h-16 text-white fill-white/50" />
                  )}
                </motion.button>

                {/* Switch to video mode indicator */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <Video className={cn(
                    "w-6 h-6 transition-colors",
                    isRecording ? "text-red-400" : "text-white/50"
                  )} />
                </div>
              </div>

              <p className="text-white/60 text-center text-sm mt-4">
                اضغط للصورة • اضغط مع الاستمرار للفيديو
              </p>
            </div>

            {/* Hidden file input for gallery */}
            <input
              id="gallery-input"
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files[0]) {
                  const isVideo = files[0].type.startsWith('video/');
                  onCapture(files[0], isVideo ? 'video' : 'image');
                }
              }}
            />
          </>
        ) : (
          /* Preview captured media */
          <div className="absolute inset-0 flex flex-col">
            {capturedMedia.type === 'image' ? (
              <img
                src={capturedMedia.url}
                alt="Captured"
                className="flex-1 object-contain bg-black"
              />
            ) : (
              <video
                src={capturedMedia.url}
                className="flex-1 object-contain bg-black"
                controls
                autoPlay
                loop
              />
            )}

            {/* Preview controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={retake}
                  className="flex flex-col items-center gap-1 text-white hover:bg-white/10"
                >
                  <Trash2 className="w-6 h-6" />
                  <span className="text-xs">إعادة</span>
                </Button>

                <Button
                  size="lg"
                  onClick={useCapturedMedia}
                  className="bg-primary hover:bg-primary/90 rounded-full px-8 py-3 flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  استخدام
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
