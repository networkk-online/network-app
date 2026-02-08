import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, X, Video, Image as ImageIcon, Gift, Sticker, Camera, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { AttachmentMenu } from "./AttachmentMenu";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { NativeCameraButton } from "./NativeCameraButton";

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
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim() || selectedFile;

  return (
    <div className="relative p-4 bg-black/90 backdrop-blur-xl border-t border-[#39FF14]/20">
      {/* معاينة الصورة المرفقة قبل الإرسال */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 relative inline-block"
          >
            <img
              src={previewUrl}
              className="h-32 w-32 object-cover rounded-2xl border-2 border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.3)]"
            />
            <button
              onClick={onRemoveFile}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 border-2 border-black"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "flex items-end gap-2 p-2 rounded-[28px] bg-[#121212] border transition-all duration-300",
          isFocused ? "border-[#39FF14] shadow-[0_0_20px_rgba(57,255,20,0.15)]" : "border-zinc-800",
        )}
      >
        {/* زر الزائد للملحقات (مثل الآيفون) */}
        <button
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 text-[#39FF14] hover:bg-[#39FF14]/10 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* حقل الكتابة */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-white py-2 text-[16px] max-h-[150px]"
          dir="auto"
        />

        {/* أزرار التفاعل السريع */}
        <div className="flex items-center gap-1 mb-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-[#39FF14] hover:bg-[#39FF14]/10 rounded-full"
          >
            <Smile className="w-6 h-6" />
          </button>

          <NativeCameraButton onPhotoTaken={onFileSelect} onGallerySelect={(files) => onFileSelect?.(files[0])} />

          {/* زر الإرسال أو المايك النيون */}
          {canSend ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSend}
              className="p-3 bg-[#39FF14] text-black rounded-full shadow-[0_0_15px_#39FF14]"
            >
              <Send className="w-5 h-5 fill-current" />
            </motion.button>
          ) : (
            <VoiceRecorderButton onVoiceRecorded={onVoiceRecorded} disabled={disabled} />
          )}
        </div>
      </div>

      {/* القوائم المنبثقة */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-4 left-4 z-50">
          <EmojiPicker onSelect={(emoji: any) => onChange(value + emoji)} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}

      {showAttachmentMenu && (
        <div className="absolute bottom-full mb-4 left-4 z-50">
          <AttachmentMenu
            isOpen={showAttachmentMenu}
            onClose={() => setShowAttachmentMenu(false)}
            onImageSelect={onFileSelect}
          />
        </div>
      )}
    </div>
  );
};
