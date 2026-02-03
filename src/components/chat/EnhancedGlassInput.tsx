import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  X, 
  Video,
  Image as ImageIcon,
  Gift,
  Sticker
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { GifPicker } from './GifPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { ReplyPreview } from './ReplyPreview';

interface ReplyTo {
  id: string;
  content?: string;
  mediaType?: 'image' | 'video' | 'voice' | 'document' | 'sticker' | 'gif';
  senderName: string;
  isOwn: boolean;
}

interface EnhancedGlassInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect?: (file: File) => void;
  onVoiceRecorded?: (blob: Blob, duration: number) => void;
  onGifSelect?: (gifUrl: string) => void;
  onStickerSelect?: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedFile?: File | null;
  previewUrl?: string | null;
  onRemoveFile?: () => void;
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
  autoFocus?: boolean;
  isTyping?: boolean;
}

export const EnhancedGlassInput = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  onVoiceRecorded,
  onGifSelect,
  onStickerSelect,
  disabled = false,
  placeholder = 'اكتب رسالتك...',
  selectedFile,
  previewUrl,
  onRemoveFile,
  replyTo,
  onCancelReply,
  autoFocus = false,
  isTyping = false,
}: EnhancedGlassInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [autoFocus, disabled]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && canSend) {
      e.preventDefault();
      onSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    textareaRef.current?.focus();
  };

  const handleGifSelect = (gifUrl: string) => {
    onGifSelect?.(gifUrl);
  };

  const canSend = value.trim() || selectedFile;

  return (
    <div ref={containerRef} className="relative p-4">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && onCancelReply && (
          <ReplyPreview replyTo={replyTo} onCancelReply={onCancelReply} />
        )}
      </AnimatePresence>

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
                  className="h-24 rounded-2xl border border-white/20 shadow-lg"
                />
              ) : selectedFile.type.startsWith('video/') ? (
                <div className="h-24 w-40 bg-[#1C1C1E] rounded-2xl flex items-center justify-center border border-white/10">
                  <Video className="w-8 h-8 text-white/40" />
                </div>
              ) : (
                <div className="h-24 w-40 bg-[#1C1C1E] rounded-2xl flex flex-col items-center justify-center border border-white/10 px-3">
                  <ImageIcon className="w-6 h-6 text-white/40 mb-1" />
                  <span className="text-[10px] text-white/40 truncate w-full text-center">
                    {selectedFile.name}
                  </span>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRemoveFile}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-black"
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pickers */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />
      
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
      />

      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onImageSelect={(file) => onFileSelect?.(file)}
        onVideoSelect={(file) => onFileSelect?.(file)}
        onDocumentSelect={(file) => onFileSelect?.(file)}
        onAudioSelect={(file) => onFileSelect?.(file)}
      />

      {/* Main Input Area */}
      <motion.div
        animate={{
          boxShadow: isFocused 
            ? '0 0 30px rgba(131, 58, 180, 0.15)' 
            : 'none'
        }}
        className={cn(
          'flex items-end gap-2 p-2 rounded-3xl',
          'bg-[#1C1C1E] border border-[#2C2C2E]',
          'transition-all duration-300',
          isFocused && 'border-[#833AB4]/40'
        )}
      >
        {/* Left Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Emoji Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
              setShowAttachmentMenu(false);
            }}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              showEmojiPicker 
                ? 'bg-[#833AB4] text-white' 
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* GIF Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
              setShowAttachmentMenu(false);
            }}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              showGifPicker 
                ? 'bg-[#833AB4] text-white' 
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
          >
            <Gift className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent border-0 outline-none resize-none',
            'text-white placeholder:text-white/40',
            'text-[15px] py-2 px-1',
            'max-h-[120px] scrollbar-hide'
          )}
          dir="auto"
        />

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Sticker Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onStickerSelect}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Sticker className="w-5 h-5" />
          </motion.button>

          {/* Attachment Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
              setShowGifPicker(false);
            }}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              showAttachmentMenu 
                ? 'bg-[#833AB4] text-white' 
                : 'text-white/50 hover:text-white hover:bg-white/10'
            )}
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
                'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]',
                'text-white shadow-lg shadow-[#833AB4]/25',
                'transition-all duration-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          ) : (
            <VoiceRecorderButton
              onVoiceRecorded={(blob, duration) => onVoiceRecorded?.(blob, duration)}
              disabled={disabled}
            />
          )}
        </div>
      </motion.div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-6 left-6"
          >
            <span className="text-xs text-white/40">جاري الكتابة...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
