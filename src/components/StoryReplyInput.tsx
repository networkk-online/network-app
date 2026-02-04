import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Send, Mic, X, ChevronUp, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StoryReplyInputProps {
  storyId: string;
  storyOwnerId: string;
  storyThumbnail?: string;
  allowReplies?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😍', '😂', '😮', '👏', '💯', '🎉'];

export const StoryReplyInput = ({
  storyId,
  storyOwnerId,
  storyThumbnail,
  allowReplies = true,
  onFocus,
  onBlur,
}: StoryReplyInputProps) => {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSentAnimation, setShowSentAnimation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSwipedUp, setIsSwipedUp] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  // Handle swipe up gesture
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -50) {
      setIsSwipedUp(true);
      setIsFocused(true);
      onFocus?.();
      inputRef.current?.focus();
    }
  };

  // Focus handling
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    if (!replyText.trim()) {
      setIsFocused(false);
      setIsSwipedUp(false);
      onBlur?.();
    }
  };

  // Send text reply
  const handleSendReply = async () => {
    if (!replyText.trim() || isSending) return;

    try {
      setIsSending(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول للرد",
          variant: "destructive",
        });
        return;
      }

      // Insert story reply with story reference
      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: user.id,
          receiver_id: storyOwnerId,
          content: replyText,
        });

      if (error) throw error;

      // Show sent animation
      setShowSentAnimation(true);
      setReplyText('');
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setTimeout(() => {
        setShowSentAnimation(false);
        setIsFocused(false);
        setIsSwipedUp(false);
        onBlur?.();
      }, 1500);

    } catch (error) {
      console.error('Error sending story reply:', error);
      toast({
        title: "خطأ",
        description: "فشل إرسال الرد",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Send quick reaction
  const handleQuickReaction = async (emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول للتفاعل",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: user.id,
          receiver_id: storyOwnerId,
          content: emoji,
        });

      if (error) throw error;

      // Haptic + Animation
      if (navigator.vibrate) {
        navigator.vibrate([30, 30, 30]);
      }

      toast({
        title: "تم الإرسال",
        description: `تم إرسال ${emoji}`,
      });

    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceReply(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "خطأ",
        description: "لا يمكن الوصول للميكروفون",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendVoiceReply = async (audioBlob: Blob) => {
    try {
      setIsSending(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload voice to storage
      const fileName = `story-reply-${user.id}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('message-media')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('message-media')
        .getPublicUrl(fileName);

      // Insert reply with voice
      const { error } = await supabase
        .from('story_replies')
        .insert({
          story_id: storyId,
          sender_id: user.id,
          receiver_id: storyOwnerId,
          content: '🎤 رسالة صوتية',
          media_url: urlData.publicUrl,
          media_type: 'voice',
        });

      if (error) throw error;

      setShowSentAnimation(true);
      setTimeout(() => {
        setShowSentAnimation(false);
        onBlur?.();
      }, 1500);

    } catch (error) {
      console.error('Error sending voice reply:', error);
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة الصوتية",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!allowReplies) {
    return (
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <p className="text-center text-white/50 text-sm">
          الردود معطلة لهذه القصة
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sent Animation Overlay */}
      <AnimatePresence>
        {showSentAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: -100, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <Plane className="w-12 h-12 text-white rotate-[-45deg]" />
              <span className="text-white font-semibold mt-2">تم الإرسال!</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute bottom-0 left-0 right-0 z-40"
      >
        {/* Quick Reactions Row */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex justify-center gap-3 mb-3 px-4"
            >
              {QUICK_REACTIONS.map((emoji, i) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 1.3 }}
                  onClick={() => handleQuickReaction(emoji)}
                  className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe Up Indicator */}
        {!isFocused && (
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex justify-center mb-2"
          >
            <ChevronUp className="w-6 h-6 text-white/50" />
          </motion.div>
        )}

        {/* Main Input */}
        <div className="px-4 pb-8 safe-area-bottom">
          <motion.div
            animate={{
              backgroundColor: isFocused ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
            }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-full backdrop-blur-xl',
              'border border-white/10 transition-all'
            )}
          >
            {/* Voice Recording State */}
            {isRecording ? (
              <div className="flex-1 flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-3 h-3 bg-red-500 rounded-full"
                />
                <span className="text-white font-mono">
                  {formatDuration(recordingDuration)}
                </span>
                <button
                  onClick={stopRecording}
                  className="ml-auto p-2 bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ) : (
              <>
                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder={isFocused ? "اكتب رداً..." : "رد على القصة..."}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-sm"
                  disabled={isSending}
                />

                {/* Send / Mic Button */}
                {replyText.trim() ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSendReply}
                    disabled={isSending}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-gradient-to-br from-[#833AB4] to-[#E1306C]',
                      isSending && 'opacity-50'
                    )}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
