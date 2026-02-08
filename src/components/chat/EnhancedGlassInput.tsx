import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, X, Video, Image as ImageIcon, Gift, Sticker } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import { GifPicker } from "./GifPicker";
import { AttachmentMenu } from "./AttachmentMenu";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import { NativeCameraButton } from "./NativeCameraButton";
import { ReplyPreview } from "./ReplyPreview";

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
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim() || selectedFile;

  return (
    <div className="relative p-4 bg-black/80 backdrop-blur-lg border-t border-[#39FF14]/30">
      <AnimatePresence>{replyTo && <ReplyPreview replyTo={replyTo} onCancelReply={onCancelReply} />}</AnimatePresence>

      <div
        className={cn(
          "flex items-end gap-2 p-2 rounded-2xl bg-zinc-900 border transition-all duration-300",
          isFocused ? "border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]" : "border-zinc-800",
        )}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-[#39FF14] hover:bg-[#39FF14]/10 rounded-full"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-white py-2 max-h-[120px]"
          dir="auto"
        />

        <div className="flex items-center gap-1">
          {canSend ? (
            <button onClick={onSend} className="p-3 bg-[#39FF14] text-black rounded-full shadow-[0_0_10px_#39FF14]">
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <VoiceRecorderButton onVoiceRecorded={onVoiceRecorded} disabled={disabled} />
          )}
        </div>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2">
          <EmojiPicker onSelect={(e: any) => onChange(value + e)} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </div>
  );
};
