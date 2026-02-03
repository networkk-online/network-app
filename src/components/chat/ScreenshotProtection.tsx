import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScreenshotProtectionProps {
  enabled?: boolean;
  onScreenshotDetected?: () => void;
  children: React.ReactNode;
}

export const ScreenshotProtection = ({
  enabled = true,
  onScreenshotDetected,
  children
}: ScreenshotProtectionProps) => {
  const { toast } = useToast();
  const [showAlert, setShowAlert] = useState(false);

  const handleScreenshotDetected = useCallback(() => {
    setShowAlert(true);
    onScreenshotDetected?.();
    
    toast({
      title: '📸 تم اكتشاف لقطة شاشة',
      description: 'سيتم إخطار المستخدم الآخر بأنك التقطت صورة للمحادثة',
      variant: 'destructive'
    });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => setShowAlert(false), 3000);
  }, [onScreenshotDetected, toast]);

  useEffect(() => {
    if (!enabled) return;

    // Detect PrintScreen key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || 
          (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) || // Mac
          (e.ctrlKey && e.key === 'PrintScreen')) {
        handleScreenshotDetected();
      }
    };

    // Detect visibility change (iOS screenshot triggers this)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Potential screenshot on mobile
        // Note: This can have false positives
      }
    };

    // Detect copy attempts
    const handleCopy = (e: ClipboardEvent) => {
      // Allow text copy but track it
      console.log('Copy detected in protected area');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled, handleScreenshotDetected]);

  return (
    <div 
      className="relative"
      style={{
        userSelect: enabled ? 'none' : 'auto',
        WebkitUserSelect: enabled ? 'none' : 'auto',
      }}
    >
      {children}

      {/* Screenshot Alert Overlay */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-lg"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <Camera className="w-10 h-10 text-red-400" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">تم اكتشاف لقطة شاشة!</h3>
                <p className="text-white/60 text-sm">
                  سيتم إخطار المستخدم الآخر
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
