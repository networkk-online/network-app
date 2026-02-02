import { useState, useRef, useEffect } from 'react';
import { X, Video, Play, Pause } from 'lucide-react';
import { Message } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble, TypingIndicator, GlassInput } from '@/components/communication';

interface ChatWindowProps {
  messages: Message[];
  currentUserId?: string;
  otherUser?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  onSendMessage: (content: string | null, mediaFile?: File, settings?: any) => Promise<any>;
}

export const ChatWindow = ({
  messages,
  currentUserId,
  otherUser,
  onSendMessage
}: ChatWindowProps) => {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate typing indicator (in real app, this would come from real-time subscription)
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setIsTyping(Math.random() > 0.7);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (file: File) => {
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'حجم الملف كبير جداً',
        description: file.type.startsWith('image/')
          ? 'حجم الصورة يجب أن يكون أقل من 5MB'
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
        { temporary: false, viewOnce: false, viewTwice: false }
      );

      if (result?.success) {
        setMessageText('');
        handleRemoveFile();
      } else {
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء إرسال الرسالة',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
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
    <div 
      className="flex flex-col h-full"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-4"
            >
              <span className="text-xs text-white/50 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                {formatDateHeader(date)}
              </span>
            </motion.div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {msgs.map((message, index) => {
                const isOwn = message.sender_id === currentUserId;

                return (
                  <MessageBubble
                    key={message.id}
                    content={message.content || undefined}
                    mediaUrl={message.media_url || undefined}
                    mediaType={message.media_type as 'image' | 'video' | 'voice' | undefined}
                    isOwn={isOwn}
                    timestamp={new Date(message.created_at)}
                    isRead={message.is_read || false}
                    isDelivered={true}
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

      {/* Glassmorphism Input Area */}
      <div className="bg-gradient-to-t from-black/30 to-transparent">
        <GlassInput
          value={messageText}
          onChange={setMessageText}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          disabled={sending}
          placeholder="اكتب رسالتك..."
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </div>
  );
};
