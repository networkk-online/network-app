import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Video, X, Smile, Mic, Play, Pause } from 'lucide-react';
import { Message } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const [messageSettings, setMessageSettings] = useState({
    temporary: false,
    viewOnce: false,
    viewTwice: false
  });

  const handleSend = async () => {
    if (!messageText.trim() && !selectedFile) return;

    setSending(true);
    try {
      const result = await onSendMessage(
        messageText.trim() || null,
        selectedFile || undefined,
        messageSettings
      );

      if (result?.success) {
        setMessageText('');
        handleRemoveFile();
        setMessageSettings({ temporary: false, viewOnce: false, viewTwice: false });
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
            <div className="flex justify-center mb-4">
              <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">
                {formatDateHeader(date)}
              </span>
            </div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {msgs.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                const time = format(new Date(message.created_at), 'h:mm a');

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%]`}>
                      {/* Media */}
                      {message.media_url && (
                        <div className="mb-2">
                          {message.media_type === 'image' ? (
                            <img
                              src={message.media_url}
                              alt="Shared media"
                              className="rounded-2xl max-h-64 object-cover"
                            />
                          ) : message.media_type === 'voice' ? (
                            /* Voice Message */
                            <div 
                              className={`flex items-center gap-3 px-4 py-3 rounded-3xl ${
                                isOwn
                                  ? 'bg-gradient-to-r from-purple-600 to-purple-500'
                                  : 'bg-[#2a2a4e]'
                              }`}
                            >
                              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white ml-0.5" />
                              </button>
                              <div className="flex-1 h-6 flex items-center gap-0.5">
                                {/* Waveform visualization */}
                                {Array.from({ length: 20 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1 bg-white/60 rounded-full"
                                    style={{
                                      height: `${Math.random() * 16 + 8}px`,
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <video
                              src={message.media_url}
                              controls
                              className="rounded-2xl max-h-64"
                            />
                          )}
                        </div>
                      )}

                      {/* Text Content */}
                      {message.content && (
                        <div
                          className={`rounded-3xl px-4 py-2.5 ${
                            isOwn
                              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                              : 'bg-[#2a2a4e] text-white'
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                      )}

                      {/* Time */}
                      <p className={`text-[10px] text-gray-400 mt-1 ${isOwn ? 'text-left' : 'text-right'} px-2`}>
                        {time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {previewUrl && selectedFile && (
        <div className="px-4 py-2 border-t border-white/10">
          <div className="relative inline-block">
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 rounded-2xl"
              />
            ) : (
              <div className="h-20 w-32 bg-purple-900/50 rounded-2xl flex items-center justify-center border border-purple-500/30">
                <Video className="w-8 h-8 text-purple-300" />
              </div>
            )}
            <button
              onClick={handleRemoveFile}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Emoji Button */}
          <button className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
            <Smile className="w-5 h-5 text-purple-300" />
          </button>

          {/* Input */}
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !sending) {
                  handleSend();
                }
              }}
              placeholder="Type your message"
              disabled={sending}
              className="w-full bg-[#2a2a4e] border-0 text-white placeholder:text-gray-400 rounded-full py-3 px-4 pr-12"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Voice/Send Button */}
          {messageText.trim() || selectedFile ? (
            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 p-0 flex items-center justify-center"
            >
              <Send className="w-5 h-5 text-white" />
            </Button>
          ) : (
            <button 
              className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Mic className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};