import React, { useState, useEffect } from 'react';
import { Search, Phone, Video, MoreHorizontal, Send, Smile, Paperclip, MessageCircle, Image } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'image';
  imageUrl?: string;
}

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: '2',
      text: 'مرحبًا! كيف الحال؟',
      timestamp: '10:30 ص',
      isOwn: false,
      type: 'text'
    },
    {
      id: '2',
      senderId: '1',
      text: 'أهلاً بك! الحمد لله بخير',
      timestamp: '10:31 ص',
      isOwn: true,
      type: 'text'
    },
    {
      id: '3',
      senderId: '2',
      text: 'هل يمكنك مساعدتي في شيء؟',
      timestamp: '10:32 ص',
      isOwn: false,
      type: 'text'
    },
    {
      id: '4',
      senderId: '1',
      text: 'بالطبع! ما الذي تحتاج إليه؟',
      timestamp: '10:33 ص',
      isOwn: true,
      type: 'text'
    },
    {
      id: '5',
      senderId: '2',
      text: 'شكرًا لك على المساعدة',
      timestamp: '10:35 ص',
      isOwn: false,
      type: 'text'
    }
  ]);

  const conversations = [
    {
      id: '1',
      name: 'أحمد محمد',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
      lastMessage: 'شكرًا لك على المساعدة',
      timestamp: '2 دقيقة',
      unread: 2,
      online: true
    },
    {
      id: '2',
      name: 'فاطمة أحمد',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop',
      lastMessage: 'سأرسل لك الملفات غدًا',
      timestamp: '5 دقائق',
      unread: 0,
      online: false
    },
    {
      id: '3',
      name: 'عمر السيد',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
      lastMessage: 'هل يمكننا مناقشة المشروع؟',
      timestamp: '15 دقيقة',
      unread: 1,
      online: true
    },
    {
      id: '4',
      name: 'نور الدين',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop',
      lastMessage: 'رائع! سأكون هناك',
      timestamp: '1 ساعة',
      unread: 0,
      online: false
    }
  ];

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    if (newMessage.length > 0) {
      setIsTyping(true);
      
      if (selectedChat) {
        setTypingUsers(prev => ({ ...prev, [selectedChat]: true }));
        
        typingTimeout = setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [selectedChat]: false }));
        }, 2000);
      }
    } else {
      setIsTyping(false);
    }

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [newMessage, selectedChat]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const newIncomingMessage: Message = {
          id: Date.now().toString(),
          senderId: '2',
          text: 'رسالة جديدة وصلت الآن!',
          timestamp: new Date().toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          isOwn: false,
          type: 'text'
        };

        setMessages(prev => [...prev, newIncomingMessage]);
        
        toast({
          title: "رسالة جديدة",
          description: "وصلتك رسالة جديدة من أحمد محمد",
          duration: 3000,
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [toast]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      const newMsg: Message = {
        id: Date.now().toString(),
        senderId: '1',
        text: newMessage,
        timestamp: timestamp,
        isOwn: true,
        type: 'text'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setIsTyping(false);
      console.log('إرسال رسالة:', newMessage);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        const imageMessage: Message = {
          id: Date.now().toString(),
          senderId: '1',
          text: '',
          imageUrl: e.target?.result as string,
          timestamp: timestamp,
          isOwn: true,
          type: 'image'
        };
        
        setMessages(prev => [...prev, imageMessage]);
        console.log('إرسال صورة:', file.name);
        
        toast({
          title: "تم إرسال الصورة",
          description: "تم إرسال الصورة بنجاح",
          duration: 2000,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 flex h-screen">
        <div className="w-80 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold neon-text mb-3">الرسائل</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في المحادثات..."
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-900 transition-colors ${
                  selectedChat === conv.id ? 'bg-gray-900' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-400">{conv.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400 truncate">
                        {typingUsers[conv.id] ? 'يكتب الآن...' : conv.lastMessage}
                      </p>
                      {conv.unread > 0 && (
                        <span className="bg-green-500 text-black text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={selectedConversation.avatar}
                      alt={selectedConversation.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{selectedConversation.name}</h2>
                    <p className="text-sm text-gray-400">
                      {typingUsers[selectedConversation.id] 
                        ? 'يكتب الآن...' 
                        : selectedConversation.online 
                        ? 'متصل الآن' 
                        : 'آخر ظهور منذ ساعة'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-white">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-white">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-white">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwn
                          ? 'bg-green-500 text-black'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {message.type === 'image' ? (
                        <div>
                          <img 
                            src={message.imageUrl} 
                            alt="مشاركة صورة"
                            className="max-w-full h-auto rounded-md mb-2"
                          />
                          {message.text && <p className="text-sm">{message.text}</p>}
                        </div>
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.isOwn ? 'text-black/70' : 'text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                
                {typingUsers[selectedChat || ''] && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-white cursor-pointer">
                      <Image className="w-5 h-5" />
                    </Button>
                  </label>
                  <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-white">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="bg-gray-900 border-gray-700 text-white pr-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    className="bg-green-500 hover:bg-green-600 text-black p-2"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">اختر محادثة</h2>
                <p className="text-gray-400">ابدأ محادثة جديدة أو اختر من المحادثات الموجودة</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
