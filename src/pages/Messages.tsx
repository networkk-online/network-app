import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus } from 'lucide-react';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { NewMessageDialog } from '@/components/NewMessageDialog';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const {
    conversations,
    messages,
    loading,
    currentUser,
    sendMessage,
    createConversation
  } = useMessages(selectedConversationId || undefined);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && !isCreatingConversation && conversations.length > 0) {
      startConversationWithUser(userId);
    }
  }, [searchParams, conversations, isCreatingConversation]);

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

  const startConversationWithUser = async (userId: string) => {
    try {
      setIsCreatingConversation(true);
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.participants?.some(p => p.id === userId)
      );

      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
        navigate('/messages', { replace: true });
      } else {
        // Create new conversation
        const result = await createConversation(userId);
        if (result.success && result.conversationId) {
          setSelectedConversationId(result.conversationId);
          navigate('/messages', { replace: true });
        } else if (result.error) {
          toast({
            title: "خطأ",
            description: result.error,
            variant: "destructive"
          });
          navigate('/messages', { replace: true });
        }
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء المحادثة",
        variant: "destructive"
      });
      navigate('/messages', { replace: true });
    } finally {
      setIsCreatingConversation(false);
    }
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
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h1 className="text-xl font-bold neon-text">الرسائل</h1>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewMessageDialog(true)}
              className="h-9 w-9 rounded-full hover:bg-gray-800"
            >
              <Plus className="h-5 w-5" />
            </Button>
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

      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onConversationCreated={(conversationId) => {
          setSelectedConversationId(conversationId);
        }}
      />
    </div>
  );
};

export default Messages;
