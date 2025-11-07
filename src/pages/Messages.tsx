import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  const {
    conversations,
    messages,
    loading,
    currentUser,
    sendMessage
  } = useMessages(selectedConversationId || undefined);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "سجل دخولك لعرض الرسائل",
        variant: "destructive"
      });
      navigate('/login');
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = async (content: string | null, mediaFile?: File) => {
    if (!selectedConversationId) return { success: false };
    return await sendMessage(selectedConversationId, content, mediaFile);
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const otherUser = selectedConversation?.participants?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-20 pb-8">
          <div className="text-center text-gray-500">
            جاري التحميل...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-16 flex h-screen">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-80 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold neon-text">الرسائل</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedConversationId && otherUser ? (
            <ChatWindow
              messages={messages}
              currentUserId={currentUser?.id}
              otherUser={otherUser}
              onSendMessage={handleSendMessage}
            />
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
