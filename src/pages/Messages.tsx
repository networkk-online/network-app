import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, Search, Flag, ArrowRight, Archive } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewMessageDialog } from '@/components/NewMessageDialog';
import { Badge } from '@/components/ui/badge';
import CallButtons from '@/components/CallButtons';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'primary' | 'requests' | 'general'>('all');
  
  const {
    conversations,
    messages,
    loading,
    currentUser,
    sendMessage,
    createConversation,
    loadConversations
  } = useMessages(selectedConversationId || undefined);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && !isCreatingConversation && !loading) {
      startConversationWithUser(userId);
    }
  }, [searchParams, loading, isCreatingConversation]);

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

  // Filter conversations based on search and active filter
  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants?.[0];
    const matchesSearch = !searchQuery || 
      otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const primaryCount = conversations.filter(c => (c.unread_count || 0) > 0).length;

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-0 flex h-screen">
        {/* Conversations Sidebar - Full width on mobile when no chat selected */}
        <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-border flex-col bg-background`}>
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-foreground">الرسائل</h1>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowNewMessageDialog(true)}
                className="h-9 w-9 rounded-full hover:bg-accent"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الرسائل على الاسم او اليوزر"
                className="pr-10 bg-accent border-0 text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
              className="rounded-full shrink-0 text-xs"
            >
              الكل
            </Button>
            <Button
              variant={activeFilter === 'primary' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('primary')}
              className="rounded-full shrink-0 text-xs"
            >
              <span className="flex items-center gap-1.5">
                الأساسية
                {primaryCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {primaryCount}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              variant={activeFilter === 'requests' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('requests')}
              className="rounded-full shrink-0 text-xs"
            >
              طلبات الرسائل
            </Button>
            <Button
              variant={activeFilter === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('general')}
              className="rounded-full shrink-0 text-xs"
            >
              عام
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={currentUser?.id}
              onRefresh={loadConversations}
            />
          </div>
        </div>

        {/* Chat Window - Show on mobile when conversation selected */}
        <div className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background`}>
          {selectedConversationId && otherUser ? (
            <>
              {/* Chat Header - iOS Style */}
              <div 
                className="px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Back button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                    onClick={() => setSelectedConversationId(null)}
                  >
                    <ArrowRight className="h-5 w-5 text-white" />
                  </Button>
                  <h1 className="text-lg font-semibold text-white">
                    {otherUser.full_name || otherUser.username}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <CallButtons 
                    participant={{
                      id: otherUser.id,
                      username: otherUser.username || '',
                      full_name: otherUser.full_name || '',
                      avatar_url: otherUser.avatar_url || null,
                    }}
                    variant="purple"
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <Flag className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>
              <ChatWindow
                messages={messages}
                currentUserId={currentUser?.id}
                otherUser={otherUser}
                onSendMessage={handleSendMessage}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center px-6">
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">رسائلك</h2>
                <p className="text-muted-foreground text-sm mb-4">ابدأ محادثة جديدة أو اختر من المحادثات الموجودة</p>
                <Button onClick={() => setShowNewMessageDialog(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إرسال رسالة
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav on mobile */}
      <BottomNav />

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
