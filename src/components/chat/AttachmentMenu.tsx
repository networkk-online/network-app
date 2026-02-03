import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, FileText, MapPin, Contact, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  onVideoSelect: (file: File) => void;
  onDocumentSelect: (file: File) => void;
  onLocationSelect?: () => void;
  onContactSelect?: () => void;
  onAudioSelect?: (file: File) => void;
}

const attachmentOptions = [
  { id: 'image', icon: Image, label: 'صورة', accept: 'image/*', color: 'from-purple-500 to-pink-500' },
  { id: 'video', icon: Video, label: 'فيديو', accept: 'video/*', color: 'from-red-500 to-orange-500' },
  { id: 'document', icon: FileText, label: 'مستند', accept: '.pdf,.doc,.docx,.txt,.xls,.xlsx', color: 'from-blue-500 to-cyan-500' },
  { id: 'audio', icon: Music, label: 'صوت', accept: 'audio/*', color: 'from-green-500 to-emerald-500' },
  { id: 'location', icon: MapPin, label: 'موقع', color: 'from-amber-500 to-yellow-500' },
  { id: 'contact', icon: Contact, label: 'جهة اتصال', color: 'from-teal-500 to-cyan-500' },
];

export const AttachmentMenu = ({
  isOpen,
  onClose,
  onImageSelect,
  onVideoSelect,
  onDocumentSelect,
  onLocationSelect,
  onContactSelect,
  onAudioSelect,
}: AttachmentMenuProps) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    switch (type) {
      case 'image':
        onImageSelect(file);
        break;
      case 'video':
        onVideoSelect(file);
        break;
      case 'document':
        onDocumentSelect(file);
        break;
      case 'audio':
        onAudioSelect?.(file);
        break;
    }
    onClose();
  };

  const handleClick = (id: string) => {
    if (id === 'location') {
      onLocationSelect?.();
      onClose();
    } else if (id === 'contact') {
      onContactSelect?.();
      onClose();
    } else {
      fileInputRefs.current[id]?.click();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-full right-0 mb-2 z-50"
          >
            <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {attachmentOptions.map(({ id, icon: Icon, label, accept, color }, index) => (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05, type: 'spring' }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleClick(id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center',
                      'bg-gradient-to-br shadow-lg',
                      color
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] text-white/70">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Hidden file inputs */}
          {attachmentOptions
            .filter(opt => opt.accept)
            .map(({ id, accept }) => (
              <input
                key={id}
                ref={(el) => { fileInputRefs.current[id] = el; }}
                type="file"
                accept={accept}
                onChange={handleFileChange(id)}
                className="hidden"
              />
            ))
          }
        </>
      )}
    </AnimatePresence>
  );
};
