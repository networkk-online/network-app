import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageLightbox = ({ isOpen, imageUrl, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'image.jpg';
    link.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
        >
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </motion.button>

            <div className="w-px h-6 bg-white/20" />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleRotate}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <RotateCw className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-5 h-5" />
            </motion.button>

            <div className="w-px h-6 bg-white/20" />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Image */}
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: scale, 
              opacity: 1,
              rotate: rotation
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            src={imageUrl}
            alt="Fullscreen"
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg cursor-move"
            draggable={false}
          />

          {/* Zoom indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10"
          >
            <span className="text-sm text-white/70">{Math.round(scale * 100)}%</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
