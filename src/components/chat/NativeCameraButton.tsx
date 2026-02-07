import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImageIcon, X, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { cn } from '@/lib/utils';

interface NativeCameraButtonProps {
  onPhotoTaken: (file: File) => void;
  onGallerySelect: (files: File[]) => void;
  disabled?: boolean;
  showGallery?: boolean;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export const NativeCameraButton = ({
  onPhotoTaken,
  onGallerySelect,
  disabled = false,
  showGallery = true
}: NativeCameraButtonProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleCameraCapture = async () => {
    setShowOptions(false);
    setIsLoading(true);

    try {
      if (isNative) {
        // Native camera access
        const photo = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
        });

        if (photo.webPath) {
          const response = await fetch(photo.webPath);
          const blob = await response.blob();
          const file = new File([blob], `photo_${Date.now()}.${photo.format || 'jpg'}`, {
            type: `image/${photo.format || 'jpeg'}`
          });
          onPhotoTaken(file);
        }
      } else {
        // Web fallback - use file input with capture
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
          fileInputRef.current.setAttribute('accept', 'image/*');
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPick = async () => {
    setShowOptions(false);
    setIsLoading(true);

    try {
      if (isNative) {
        // Native multi-image picker
        const images = await CapacitorCamera.pickImages({
          quality: 90,
        });

        const files: File[] = [];
        for (const photo of images.photos) {
          if (photo.webPath) {
            const response = await fetch(photo.webPath);
            const blob = await response.blob();
            const file = new File([blob], `photo_${Date.now()}_${files.length}.${photo.format || 'jpg'}`, {
              type: `image/${photo.format || 'jpeg'}`
            });
            files.push(file);
          }
        }
        
        if (files.length > 0) {
          onGallerySelect(files);
        }
      } else {
        // Web fallback
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('capture');
          fileInputRef.current.setAttribute('accept', 'image/*,video/*');
          fileInputRef.current.setAttribute('multiple', 'true');
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (e.target.hasAttribute('capture')) {
      onPhotoTaken(files[0]);
    } else {
      onGallerySelect(files);
    }
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="relative">
      {/* Hidden file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={springConfig}
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isLoading}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center transition-all',
          showOptions 
            ? 'bg-[#833AB4] text-white' 
            : 'text-white/50 hover:text-white hover:bg-white/10',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <Camera className="w-5 h-5" />
        )}
      </motion.button>

      {/* Options popup */}
      <AnimatePresence>
        {showOptions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptions(false)}
              className="fixed inset-0 z-40"
            />

            {/* Options menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={springConfig}
              className="absolute bottom-full mb-2 right-0 z-50 min-w-[160px]"
            >
              <div className="bg-[#1C1C1E]/98 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Camera option */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCameraCapture}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] to-[#E1306C] flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">الكاميرا</span>
                </motion.button>

                {showGallery && (
                  <>
                    <div className="h-px bg-white/10" />
                    
                    {/* Gallery option */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGalleryPick}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">المعرض</span>
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
