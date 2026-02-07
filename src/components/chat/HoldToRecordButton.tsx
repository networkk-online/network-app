import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mic, StopCircle, Trash2, Send, Lock, LockOpen, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoldToRecordButtonProps {
  onVoiceRecorded: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

// Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

// Format duration in mm:ss
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Haptic feedback
const triggerHaptic = () => {
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export const HoldToRecordButton = ({ onVoiceRecorded, disabled }: HoldToRecordButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [slideY, setSlideY] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startYRef = useRef<number>(0);
  const isHoldingRef = useRef(false);

  // Generate waveform bars
  const waveformBars = useMemo(() => 
    Array.from({ length: 35 }, (_, i) => ({
      baseHeight: Math.random() * 15 + 8,
      delay: i * 0.015
    })), 
  []);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setIsPaused(false);
    setIsLocked(false);
    setShowRecordingUI(false);
    setDuration(0);
    setAudioLevel(0);
    setSlideY(0);
    isHoldingRef.current = false;
  }, []);

  const startAudioVisualization = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  }, [isRecording]);

  const startRecording = async () => {
    try {
      triggerHaptic();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        } 
      });
      streamRef.current = stream;
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setShowRecordingUI(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      startAudioVisualization();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      triggerHaptic();
      
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        onVoiceRecorded(blob, duration);
        cleanup();
      };
    }
  }, [isRecording, duration, onVoiceRecorded, cleanup]);

  const cancelRecording = useCallback(() => {
    triggerHaptic();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      triggerHaptic();
      
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
        startAudioVisualization();
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPaused(!isPaused);
    }
  }, [isRecording, isPaused, startAudioVisualization]);

  // Hold-to-record handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isRecording) return;
    startYRef.current = e.clientY;
    isHoldingRef.current = true;
    startRecording();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHoldingRef.current || !isRecording || isLocked) return;
    
    const deltaY = startYRef.current - e.clientY;
    setSlideY(Math.max(0, Math.min(deltaY, 100)));
    
    // Lock if slid up enough
    if (deltaY > 80) {
      setIsLocked(true);
      isHoldingRef.current = false;
      triggerHaptic();
    }
  };

  const handlePointerUp = () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setSlideY(0);
    
    if (isRecording && !isLocked) {
      // Quick release - send the recording
      if (duration >= 1) {
        stopRecording();
      } else {
        cancelRecording();
      }
    }
  };

  const handlePointerLeave = () => {
    if (!isLocked && isHoldingRef.current) {
      isHoldingRef.current = false;
      setSlideY(0);
      if (isRecording && duration < 1) {
        cancelRecording();
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {showRecordingUI && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={springConfig}
            className="absolute bottom-full left-0 right-0 mb-2 mx-4"
          >
            <div className={cn(
              'bg-[#1C1C1E]/98 backdrop-blur-2xl rounded-3xl',
              'border border-white/10 shadow-2xl p-5'
            )}>
              {/* Lock indicator */}
              <AnimatePresence>
                {!isLocked && isRecording && slideY > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                  >
                    <motion.div 
                      animate={{ scale: slideY > 60 ? 1.2 : 1 }}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        slideY > 60 ? 'bg-[#833AB4]' : 'bg-white/10'
                      )}
                    >
                      {slideY > 60 ? (
                        <Lock className="w-5 h-5 text-white" />
                      ) : (
                        <LockOpen className="w-5 h-5 text-white/50" />
                      )}
                    </motion.div>
                    <span className="text-xs text-white/50">اسحب للأعلى للتثبيت</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center h-14 gap-[3px] mb-4">
                {waveformBars.map((bar, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 6 }}
                    animate={{ 
                      height: isRecording && !isPaused 
                        ? bar.baseHeight * (0.5 + audioLevel * 1.5)
                        : bar.baseHeight * 0.4,
                      opacity: isRecording && !isPaused ? 0.8 + audioLevel * 0.2 : 0.4
                    }}
                    transition={{ 
                      duration: 0.1,
                      delay: bar.delay
                    }}
                    className={cn(
                      'w-[4px] rounded-full transition-colors',
                      isRecording && !isPaused 
                        ? 'bg-gradient-to-t from-[#833AB4] to-[#E1306C]' 
                        : 'bg-white/30'
                    )}
                  />
                ))}
              </div>

              {/* Duration Display */}
              <div className="text-center mb-5">
                <motion.span 
                  animate={{ 
                    color: isRecording && !isPaused ? '#ef4444' : '#ffffff' 
                  }}
                  className="text-3xl font-mono tabular-nums font-medium"
                >
                  {formatDuration(duration)}
                </motion.span>
                {isRecording && !isPaused && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="inline-block w-2 h-2 bg-red-500 rounded-full ml-2 align-middle"
                  />
                )}
                {isLocked && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs text-[#833AB4]">
                    <Lock className="w-3 h-3" />
                    <span>وضع التسجيل الحر</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5">
                {/* Cancel */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springConfig}
                  onClick={cancelRecording}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    'bg-white/10 hover:bg-red-500/20 transition-colors duration-200',
                    'text-red-400'
                  )}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>

                {/* Pause/Resume - only when locked */}
                {isLocked && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springConfig}
                    onClick={pauseRecording}
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center',
                      'bg-white/10 hover:bg-white/20 transition-colors duration-200',
                      'text-white'
                    )}
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6 ml-0.5" />
                    ) : (
                      <Pause className="w-6 h-6" />
                    )}
                  </motion.button>
                )}

                {/* Send */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springConfig}
                  onClick={stopRecording}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]',
                    'text-white shadow-lg shadow-[#833AB4]/30'
                  )}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Button with Hold-to-Record */}
      {!showRecordingUI && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springConfig}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]',
            'text-white shadow-lg shadow-[#833AB4]/30',
            'transition-all duration-300 touch-none select-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Mic className="w-5 h-5" />
        </motion.button>
      )}
    </>
  );
};
