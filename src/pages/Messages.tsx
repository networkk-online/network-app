
import React, { useState } from 'react';
import { Search, Phone, Video, MoreHorizontal, Send, Smile, Paperclip } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');

  // بيانات وهمية للمحادثات
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

  // رسائل المحادثة المختارة
  const messages = [
    {
      id: '1',
      senderId: '2',
      text: 'مرحبًا! كيف الحال؟',
      timestamp: '10:30 ص',
      isOwn: false
    },
    {
      id: '2',
      senderId: '1',
      text: 'أهلاً بك! الحمد لله بخير',
      timestamp: '10:31 ص',
      isOwn: true
    },
    {
      id: '3',
      senderId: '2',
      text: 'هل يمكنك مساعدتي في شيء؟',
      timestamp: '10:32 ص',
      isOwn: false
    },
    {
      id: '4',
      senderId: '1',
      text: 'بالطبع! ما الذي تحتاج إليه؟',
      timestamp: '10:33 ص',
      isOwn: true
    },
    {
      id: '5',
      senderId: '2',
      text: 'شكرًا لك على المساعدة',
      timestamp: '10:35 ص',
      isOwn: false
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('إرسال رسالة:', newMessage);
      setNewMessage('');
    }
  };

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 flex h-screen">
        {/* قائمة المحادثات */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          {/* رأس قائمة المحادثات */}
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

          {/* قائمة المحادثات */}
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
                      <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="bg-green-500 text-black text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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

        {/* نافذة المحادثة */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* رأس المحادثة */}
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
                      {selectedConversation.online ? 'متصل الآن' : 'آخر ظهور منذ ساعة'}
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

              {/* منطقة الرسائل */}
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
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.isOwn ? 'text-black/70' : 'text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* صندوق كتابة الرسالة */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center space-x-2">
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
