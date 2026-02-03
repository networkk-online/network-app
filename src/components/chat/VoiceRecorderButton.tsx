import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, Trash2, Send, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderButtonProps {
  onVoiceRecorded: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

// Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

// Format duration in mm:ss with proper rounding
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

export const VoiceRecorderButton = ({ onVoiceRecorded, disabled }: VoiceRecorderButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate waveform bars with dynamic animation based on audio level
  const waveformBars = useMemo(() => 
    Array.from({ length: 35 }, (_, i) => ({
      baseHeight: Math.random() * 15 + 8,
      delay: i * 0.015
    })), 
  []);

  useEffect(() => {
    return () => {
      cleanup();
    };
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
    setShowRecordingUI(false);
    setDuration(0);
    setAudioLevel(0);
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
      
      // Use opus codec for high-quality, small file size
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

      mediaRecorder.start(100); // Collect data every 100ms for smoother visualization
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

                {/* Pause/Resume */}
                <motion.button
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

      {/* Mic Button */}
      {!showRecordingUI && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springConfig}
          onClick={startRecording}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]',
            'text-white shadow-lg shadow-[#833AB4]/30',
            'transition-all duration-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Mic className="w-5 h-5" />
        </motion.button>
      )}
    </>
  );
};
