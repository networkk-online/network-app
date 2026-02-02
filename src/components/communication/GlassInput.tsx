import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Mic, Smile, Paperclip, X, Video, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedFile?: File | null;
  previewUrl?: string | null;
  onRemoveFile?: () => void;
  isRecording?: boolean;
}

export const GlassInput = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  onVoiceStart,
  onVoiceStop,
  disabled = false,
  placeholder = 'اكتب رسالتك...',
  selectedFile,
  previewUrl,
  onRemoveFile,
  isRecording = false
}: GlassInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const canSend = value.trim() || selectedFile;

  return (
    <div className="p-4">
      {/* File Preview */}
      <AnimatePresence>
        {previewUrl && selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3"
          >
            <div className="relative inline-block">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-20 rounded-2xl border border-white/20"
                />
              ) : (
                <div className="h-20 w-32 bg-purple-900/50 rounded-2xl flex items-center justify-center border border-purple-500/30">
                  <Video className="w-8 h-8 text-purple-300" />
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRemoveFile}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <motion.div
        animate={{
          boxShadow: isFocused 
            ? '0 0 30px rgba(147, 51, 234, 0.3)' 
            : '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
        className={cn(
          'flex items-center gap-2 p-1.5 rounded-full',
          'bg-white/10 backdrop-blur-xl border border-white/20',
          'transition-all duration-300',
          isFocused && 'border-purple-500/50'
        )}
      >
        {/* Emoji Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Smile className="w-5 h-5" />
        </motion.button>

        {/* Text Input */}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !disabled && canSend) {
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 bg-transparent border-0 outline-none',
            'text-white placeholder:text-white/40',
            'text-sm py-2 px-1'
          )}
          dir="auto"
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Attachment Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Voice / Send Button */}
          {canSend ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={disabled}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-gradient-to-r from-purple-600 to-purple-500',
                'text-white shadow-lg shadow-purple-500/30',
                'transition-all duration-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={onVoiceStart}
              onMouseUp={onVoiceStop}
              onTouchStart={onVoiceStart}
              onTouchEnd={onVoiceStop}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'transition-all duration-300',
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30'
              )}
            >
              {isRecording ? (
                <StopCircle className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
