import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, Trash2, Send, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderButtonProps {
  onVoiceRecorded: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export const VoiceRecorderButton = ({ onVoiceRecorded, disabled }: VoiceRecorderButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowRecordingUI(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onVoiceRecorded(blob, duration);
        cleanup();
      };
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      cleanup();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setShowRecordingUI(false);
    setDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars
  const waveformBars = Array.from({ length: 30 }, () => Math.random() * 20 + 5);

  return (
    <>
      <AnimatePresence>
        {showRecordingUI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 right-0 mb-2 mx-4"
          >
            <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4">
              {/* Waveform */}
              <div className="flex items-center justify-center h-12 gap-0.5 mb-4">
                {waveformBars.map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 4 }}
                    animate={{ 
                      height: isRecording && !isPaused 
                        ? [height * 0.5, height, height * 0.5] 
                        : height * 0.3 
                    }}
                    transition={{ 
                      repeat: isRecording && !isPaused ? Infinity : 0, 
                      duration: 0.5 + Math.random() * 0.5,
                    }}
                    className={cn(
                      'w-1 rounded-full',
                      isRecording && !isPaused 
                        ? 'bg-gradient-to-t from-[#833AB4] to-[#E1306C]' 
                        : 'bg-white/30'
                    )}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>

              {/* Duration */}
              <div className="text-center mb-4">
                <span className={cn(
                  'text-2xl font-mono',
                  isRecording && !isPaused ? 'text-red-400' : 'text-white'
                )}>
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {/* Cancel */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={cancelRecording}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>

                {/* Pause/Resume */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={pauseRecording}
                  className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
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
                  onClick={stopRecording}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C] flex items-center justify-center text-white shadow-lg"
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          disabled={disabled}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]',
            'text-white shadow-lg',
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
