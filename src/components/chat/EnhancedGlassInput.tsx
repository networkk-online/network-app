import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, X, Video, Image as ImageIcon, Gift, Sticker } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { AttachmentMenu } from "./AttachmentMenu";
import { VoiceRecorderButton } from "./VoiceRecorderButton"; // غيرنا الزر للنسخة المطورة
import { NativeCameraButton } from "./NativeCameraButton";
import { ReplyPreview } from "./ReplyPreview";

interface ReplyTo {
  id: string;
  content?: string;
  mediaType?: "image" | "video" | "voice" | "document" | "sticker" | "gif";
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
  placeholder = "اكتب رسالتك...",
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

  // تثبيت الستوري عند التفاعل مع المدخلات
  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && (value.trim() || selectedFile)) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim() || selectedFile;

  return (
    <div className="relative p-4 overlay-panel-active" onClick={handleInteraction}>
      {/* Reply & File Previews */}
      <AnimatePresence>
        {replyTo && onCancelReply && <ReplyPreview replyTo={replyTo} onCancelReply={onCancelReply} />}
        {previewUrl && selectedFile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
            <div className="relative inline-block">
              {selectedFile.type.startsWith("image/") ? (
                <img src={previewUrl} alt="Preview" className="h-24 rounded-2xl border border-white/20 shadow-lg" />
              ) : (
                <div className="h-24 w-40 bg-[#1C1C1E] rounded-2xl flex items-center justify-center border border-white/10">
                  <Video className="w-8 h-8 text-white/40" />
                </div>
              )}
              <button
                onClick={onRemoveFile}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center border-2 border-black"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={(emoji) => onChange(value + emoji)}
      />
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={(url) => onGifSelect?.(url)}
      />
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onImageSelect={onFileSelect}
        onVideoSelect={onFileSelect}
      />

      {/* حقل الإدخال الرئيسي */}
      <motion.div
        className={cn(
          "flex items-end gap-2 p-2 rounded-3xl bg-[#1C1C1E] border border-[#2C2C2E] transition-all",
          isFocused && "border-[#833AB4]/40 shadow-[0_0_20px_rgba(131,58,180,0.1)]",
        )}
      >
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10"
          >
            <Gift className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-white text-[15px] py-2 px-1 max-h-[120px]"
          dir="auto"
        />

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onStickerSelect}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10"
          >
            <Sticker className="w-5 h-5" />
          </button>

          <NativeCameraButton onPhotoTaken={onFileSelect} onGallerySelect={(files) => onFileSelect?.(files[0])} />

          {/* زر الإرسال أو المايك المطور */}
          {canSend ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSend}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#833AB4] to-[#E1306C] text-white"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          ) : (
            <VoiceRecorderButton onVoiceRecorded={(blob, dur) => onVoiceRecorded?.(blob, dur)} disabled={disabled} />
          )}
        </div>
      </motion.div>
    </div>
  );
};
