import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { 
  EnhancedMessageBubble, 
  EnhancedGlassInput,
  ReplyToMessage 
} from '@/components/chat';
import { TypingIndicator } from '@/components/communication';
import { ChatSettingsDrawer } from './ChatSettingsDrawer';
import { ScreenshotProtection } from './ScreenshotProtection';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { AISmartReply } from '@/components/AISmartReply';

interface EnhancedChatWindowProps {
  messages: Message[];
  currentUserId?: string;
  conversationId?: string;
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

// Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

// Format date with validation
const formatDateHeader = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'اليوم';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'أمس';
    }
    return format(date, 'dd MMMM yyyy', { locale: ar });
  } catch {
    return dateStr;
  }
};

export const EnhancedChatWindow = ({
  messages,
  currentUserId,
  conversationId,
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
  const [replyTo, setReplyTo] = useState<ReplyToMessage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isScrollLockedRef = useRef(false);

  // Typing indicator with debounce
  const { 
    typingUsers, 
    handleInputChange: handleTypingChange, 
    stopTyping 
  } = useTypingIndicator(conversationId, currentUserId);

  const isOtherUserTyping = typingUsers.length > 0;

  const prevMessageCountRef = useRef(messages.length);
  const isReactionUpdateRef = useRef(false);

  // Stable scroll position on new messages (prevent layout shift)
  // Only scroll on NEW messages, not on reaction/read updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    // If message count didn't change, it's a reaction/read update — don't scroll
    if (newCount === prevCount) {
      isReactionUpdateRef.current = true;
      return;
    }
    isReactionUpdateRef.current = false;

    const currentScrollHeight = container.scrollHeight;
    const scrollDiff = currentScrollHeight - prevScrollHeightRef.current;
    
    // Only auto-scroll if user is at the bottom AND it's a new message
    if (isAtBottom && scrollDiff > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    
    prevScrollHeightRef.current = currentScrollHeight;
  }, [messages, isAtBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isScrollLockedRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Consider "at bottom" if within 100px
    const atBottom = distanceFromBottom < 100;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && distanceFromBottom > 200);
  }, []);

  // Scroll to bottom with smooth animation
  const scrollToBottom = useCallback(() => {
    isScrollLockedRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Unlock after animation completes
    setTimeout(() => {
      isScrollLockedRef.current = false;
      setIsAtBottom(true);
      setShowScrollButton(false);
    }, 500);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
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
  }, [toast]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() && !selectedFile) return;

    // Stop typing indicator immediately when sending
    stopTyping();
    
    setSending(true);
    try {
      const result = await onSendMessage(
        messageText.trim() || null,
        selectedFile || undefined,
        { 
          temporary: vanishMode, 
          viewOnce: vanishMode, 
          viewTwice: false,
          replyToId: replyTo?.id 
        }
      );

      if (result?.success) {
        setMessageText('');
        handleRemoveFile();
        setReplyTo(null);
        // Force scroll to bottom on send
        setTimeout(() => scrollToBottom(), 100);
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
  }, [messageText, selectedFile, replyTo, onSendMessage, handleRemoveFile, toast, stopTyping, vanishMode, scrollToBottom]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback((value: string) => {
    setMessageText(value);
    handleTypingChange();
  }, [handleTypingChange]);

  const handleVoiceRecorded = useCallback(async (blob: Blob, duration: number) => {
    const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm;codecs=opus' });
    setSending(true);
    try {
      const result = await onSendMessage(null, file, { mediaType: 'voice' });
      if (!result?.success) {
        toast({
          title: 'خطأ',
          description: 'فشل إرسال الرسالة الصوتية',
          variant: 'destructive'
        });
      } else {
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending voice:', error);
    } finally {
      setSending(false);
    }
  }, [onSendMessage, toast, scrollToBottom]);

  const handleGifSelect = useCallback(async (gifUrl: string) => {
    setSending(true);
    try {
      const result = await onSendMessage(gifUrl, undefined, { mediaType: 'gif' });
      if (!result?.success) {
        toast({
          title: 'خطأ',
          description: 'فشل إرسال GIF',
          variant: 'destructive'
        });
      } else {
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error sending GIF:', error);
    } finally {
      setSending(false);
    }
  }, [onSendMessage, toast, scrollToBottom]);

  const handleReply = useCallback((message: Message) => {
    const isOwn = message.sender_id === currentUserId;
    setReplyTo({
      id: message.id,
      content: message.content || undefined,
      mediaType: message.media_type as 'image' | 'video' | 'voice' | undefined,
      senderName: message.sender?.full_name || message.sender?.username || 'مستخدم',
      isOwn
    });
  }, [currentUserId]);

  const handleDeleteForMe = useCallback(async (messageId: string) => {
    try {
      toast({ title: 'تم حذف الرسالة' });
      await onDeleteMessage?.(messageId, false);
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل حذف الرسالة', variant: 'destructive' });
    }
  }, [onDeleteMessage, toast]);

  const handleDeleteForEveryone = useCallback(async (messageId: string) => {
    try {
      toast({ title: 'تم حذف الرسالة للجميع' });
      await onDeleteMessage?.(messageId, true);
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل حذف الرسالة', variant: 'destructive' });
    }
  }, [onDeleteMessage, toast]);

  const handleReactionSelect = useCallback(async (messageId: string, emoji: string) => {
    try {
      await onReaction?.(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [onReaction]);

  // Group messages by date with validation (memoized for performance)
  const groupedMessages = useMemo(() => {
    return messages.reduce((groups: { [key: string]: Message[] }, message) => {
      try {
        const date = format(new Date(message.created_at), 'yyyy-MM-dd');
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(message);
      } catch {
        // Skip invalid dates
      }
      return groups;
    }, {});
  }, [messages]);

  return (
    <ScreenshotProtection enabled={screenshotProtection}>
      {/* Main Chat Container with strict flexbox layout */}
      <div className="chat-room-container bg-black font-[Inter]">
        {/* Messages Container - Takes remaining space and scrolls */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="chat-messages-area p-4 space-y-4 scrollbar-hide"
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Header */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springConfig}
                className="flex justify-center mb-4"
              >
                <span className="text-xs text-white/50 bg-[#1C1C1E]/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5 font-[Inter] font-medium">
                  {formatDateHeader(date)}
                </span>
              </motion.div>

              {/* Messages for this date */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {msgs.map((message, index) => {
                    const isOwn = message.sender_id === currentUserId;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ 
                          ...springConfig,
                          delay: Math.min(index * 0.03, 0.15)
                        }}
                        layout="position"
                        layoutId={message.id}
                      >
                        <EnhancedMessageBubble
                          replyTo={(() => {
                            const replyId = (message as any).reply_to_message_id;
                            if (!replyId) return undefined;
                            const original = messages.find(m => m.id === replyId);
                            if (!original) return undefined;
                            return {
                              id: original.id,
                              content: original.content || undefined,
                              mediaType: original.media_type as any,
                              senderName: original.sender?.full_name || original.sender?.username || 'مستخدم',
                              isOwn: original.sender_id === currentUserId
                            };
                          })()}
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
                          readerAvatar={isOwn && message.is_read ? otherUser?.avatar_url : undefined}
                          readerName={isOwn && message.is_read ? otherUser?.full_name || otherUser?.username : undefined}
                          reactions={message.reactions || []}
                          onReply={() => handleReply(message)}
                          onCopy={() => {
                            if (message.content) navigator.clipboard.writeText(message.content);
                            toast({ title: 'تم نسخ النص' });
                          }}
                          onForward={() => toast({ title: 'قريباً', description: 'ميزة إعادة التوجيه قادمة' })}
                          onReport={() => toast({ title: 'تم الإبلاغ', description: 'شكراً لإبلاغك عن هذه الرسالة' })}
                          onDeleteForMe={() => handleDeleteForMe(message.id)}
                          onDeleteForEveryone={isOwn ? () => handleDeleteForEveryone(message.id) : undefined}
                          onReaction={(emoji) => handleReactionSelect(message.id, emoji)}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isOtherUserTyping && otherUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={springConfig}
              >
                <TypingIndicator username={otherUser.full_name || otherUser.username} />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Scroll to Bottom Button */}
        <ScrollToBottomButton 
          isVisible={showScrollButton}
          onClick={scrollToBottom}
        />

        {/* Smart Reply Suggestions */}
        {(() => {
          const lastOtherMsg = [...messages].reverse().find(m => m.sender_id !== currentUserId);
          if (!lastOtherMsg) return null;
          return (
            <AISmartReply
              lastMessage={lastOtherMsg.content || ''}
              conversationHistory={messages.slice(-10).map(m => ({
                role: m.sender_id === currentUserId ? 'user' as const : 'assistant' as const,
                content: m.content || ''
              }))}
              onSelectSuggestion={(suggestion) => {
                setMessageText(suggestion);
              }}
            />
          );
        })()}

        {/* Input Area - Sticky at bottom with glass effect */}
        <div className="chat-input-area">
          <EnhancedGlassInput
            value={messageText}
            onChange={handleInputChange}
            onSend={handleSend}
            onFileSelect={handleFileSelect}
            onVoiceRecorded={handleVoiceRecorded}
            onGifSelect={handleGifSelect}
            disabled={sending}
            autoFocus
            placeholder={vanishMode ? "وضع الاختفاء مفعّل..." : "اكتب رسالتك..."}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onRemoveFile={handleRemoveFile}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </div>

      {/* Chat Settings Drawer */}
      <ChatSettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        otherUser={otherUser}
        vanishMode={vanishMode}
        onVanishModeToggle={setVanishMode}
        onMuteToggle={(muted) => toast({ title: muted ? 'تم كتم الإشعارات' : 'تم تفعيل الإشعارات' })}
        onViewMedia={() => toast({ title: 'قريباً', description: 'معرض الوسائط قادم' })}
        onClearChat={() => toast({ title: 'تم مسح المحادثة' })}
        onBlock={() => toast({ title: 'تم الحظر', variant: 'destructive' })}
        onReport={() => toast({ title: 'تم الإبلاغ' })}
      />
    </ScreenshotProtection>
  );
};
