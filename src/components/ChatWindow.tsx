import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Video, X, Clock, Eye, MoreVertical, Trash2, Archive } from 'lucide-react';
import { Message } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%]`}>
                {message.media_url && (
                  <div className="mb-2">
                    {message.media_type === 'image' ? (
                      <img
                        src={message.media_url}
                        alt="Shared media"
                        className="rounded-2xl max-h-64 object-cover"
                      />
                    ) : (
                      <video
                        src={message.media_url}
                        controls
                        className="rounded-2xl max-h-64"
                      />
                    )}
                  </div>
                )}
                {message.content && (
                  <div
                    className={`rounded-3xl px-4 py-2.5 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-foreground border border-border'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 px-2">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ar
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {previewUrl && selectedFile && (
        <div className="px-4 py-2 border-t border-border bg-background">
          <div className="relative inline-block">
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 rounded-2xl"
              />
            ) : (
              <div className="h-20 w-32 bg-accent rounded-2xl flex items-center justify-center border border-border">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={handleRemoveFile}
              className="absolute -top-2 -right-2 bg-destructive rounded-full p-1"
            >
              <X className="w-4 h-4 text-destructive-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="text-primary hover:text-primary/80 h-10 w-10"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !sending) {
                handleSend();
              }
            }}
            placeholder="اكتب رسالة..."
            disabled={sending}
            className="flex-1 bg-accent border-0 text-foreground placeholder:text-muted-foreground rounded-3xl"
          />
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && !selectedFile) || sending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 w-10 p-0"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
