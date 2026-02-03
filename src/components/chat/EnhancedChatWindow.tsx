import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/hooks/useMessages';
import { 
  EnhancedMessageBubble, 
  EnhancedGlassInput,
  ReplyToMessage 
} from '@/components/chat';
import { TypingIndicator } from '@/components/communication';

interface EnhancedChatWindowProps {
  messages: Message[];
  currentUserId?: string;
  otherUser?: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  onSendMessage: (content: string | null, mediaFile?: File, settings?: any) => Promise<any>;
  onDeleteMessage?: (messageId: string, forEveryone: boolean) => Promise<void>;
  onReaction?: (messageId: string, emoji: string) => Promise<void>;
}

export const EnhancedChatWindow = ({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
  onDeleteMessage,
  onReaction,
}: EnhancedChatWindowProps) => {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setIsTyping(Math.random() > 0.8);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleFileSelect = (file: File) => {
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'حجم الملف كبير جداً',
        description: file.type.startsWith('image/')
          ? 'حجم الصورة يجب أن يكون أقل من 10MB'
          : 'حجم الفيديو يجب أن يكون أقل من 50MB',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      const result = await onSendMessage(
        messageText.trim() || null,
        selectedFile || undefined,
        { 
          temporary: false, 
          viewOnce: false, 
          viewTwice: false,
          replyToId: replyTo?.id 
        }
      );

      if (result?.success) {
        setMessageText('');
        handleRemoveFile();
        setReplyTo(null);
      } else {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء إرسال الرسالة',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecorded = async (blob: Blob, duration: number) => {
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
    setSending(true);
    try {
      const result = await onSendMessage(null, file, { mediaType: 'voice' });
      if (!result?.success) {
        toast({
          title: 'خطأ',
          description: 'فشل إرسال الرسالة الصوتية',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending voice:', error);
    } finally {
      setSending(false);
    }
  };

  const handleGifSelect = async (gifUrl: string) => {
    // Create a message with the GIF URL
    setSending(true);
    try {
      const result = await onSendMessage(gifUrl, undefined, { mediaType: 'gif' });
      if (!result?.success) {
        toast({
          title: 'خطأ',
          description: 'فشل إرسال GIF',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending GIF:', error);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message: Message) => {
    const isOwn = message.sender_id === currentUserId;
    setReplyTo({
      id: message.id,
      content: message.content || undefined,
      mediaType: message.media_type as 'image' | 'video' | 'voice' | undefined,
      senderName: message.sender?.full_name || message.sender?.username || 'مستخدم',
      isOwn
    });
  };

  const handleDeleteForMe = async (messageId: string) => {
    try {
      await onDeleteMessage?.(messageId, false);
      toast({ title: 'تم حذف الرسالة' });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل حذف الرسالة', variant: 'destructive' });
    }
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    try {
      await onDeleteMessage?.(messageId, true);
      toast({ title: 'تم حذف الرسالة للجميع' });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل حذف الرسالة', variant: 'destructive' });
    }
  };

  const handleReactionSelect = async (messageId: string, emoji: string) => {
    try {
      await onReaction?.(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'اليوم';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'أمس';
    }
    return format(date, 'dd MMMM yyyy', { locale: ar });
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Messages Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-4"
            >
              <span className="text-xs text-white/50 bg-[#1C1C1E] px-4 py-1.5 rounded-full border border-white/5">
                {formatDateHeader(date)}
              </span>
            </motion.div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {msgs.map((message) => {
                const isOwn = message.sender_id === currentUserId;

                return (
                  <EnhancedMessageBubble
                    key={message.id}
                    id={message.id}
                    content={message.content || undefined}
                    mediaUrl={message.media_url || undefined}
                    mediaType={message.media_type as 'image' | 'video' | 'voice' | undefined}
                    isOwn={isOwn}
                    timestamp={new Date(message.created_at)}
                    isRead={message.is_read || false}
                    isDelivered={true}
                    senderName={message.sender?.full_name || message.sender?.username}
                    senderAvatar={message.sender?.avatar_url}
                    onReply={() => handleReply(message)}
                    onCopy={() => toast({ title: 'تم النسخ' })}
                    onForward={() => toast({ title: 'قريباً', description: 'ميزة إعادة التوجيه قادمة' })}
                    onReport={() => toast({ title: 'تم الإبلاغ' })}
                    onDeleteForMe={() => handleDeleteForMe(message.id)}
                    onDeleteForEveryone={isOwn ? () => handleDeleteForEveryone(message.id) : undefined}
                    onReaction={(emoji) => handleReactionSelect(message.id, emoji)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && otherUser && (
            <TypingIndicator username={otherUser.full_name || otherUser.username} />
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#1C1C1E]">
        <EnhancedGlassInput
          value={messageText}
          onChange={setMessageText}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          onVoiceRecorded={handleVoiceRecorded}
          onGifSelect={handleGifSelect}
          disabled={sending}
          autoFocus
          placeholder="اكتب رسالتك..."
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          onRemoveFile={handleRemoveFile}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
    </div>
  );
};
