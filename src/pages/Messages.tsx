import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, Search, Flag, ArrowRight, Phone, Video } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/ConversationList';
import { EnhancedChatWindow } from '@/components/chat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewMessageDialog } from '@/components/NewMessageDialog';
import { Badge } from '@/components/ui/badge';
import CallButtons from '@/components/CallButtons';
import { OnlineStatus } from '@/components/communication';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
      
      const existingConversation = conversations.find(conv => 
        conv.participants?.some(p => p.id === userId)
      );

      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
        navigate('/messages', { replace: true });
      } else {
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-8">
          <div className="flex items-center justify-center h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-0 flex h-screen">
        {/* Conversations Sidebar with Glassmorphism */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-white/10 flex-col`}
          style={{
            background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%)',
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">الرسائل</h1>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewMessageDialog(true)}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>

            {/* Search Bar with Glass Effect */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الرسائل"
                className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl backdrop-blur-md focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Filters with Glass Effect */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'primary', label: 'الأساسية', count: primaryCount },
              { key: 'requests', label: 'طلبات الرسائل' },
              { key: 'general', label: 'عام' }
            ].map((filter) => (
              <motion.button
                key={filter.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
                  activeFilter === filter.key
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {filter.label}
                  {filter.count && filter.count > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                      {filter.count}
                    </span>
                  )}
                </span>
              </motion.button>
            ))}
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
        </motion.div>

        {/* Chat Window with Enhanced Design */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedConversationId || 'empty'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${selectedConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background`}
          >
            {selectedConversationId && otherUser ? (
              <>
                {/* Chat Header with Glassmorphism */}
                <motion.div 
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-white/10"
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Back button */}
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 md:hidden"
                        onClick={() => setSelectedConversationId(null)}
                      >
                        <ArrowRight className="h-5 w-5 text-white" />
                      </Button>
                    </motion.div>
                    
                    {/* User Avatar & Info */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-purple-500/30">
                          <AvatarImage src={otherUser.avatar_url || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                            {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <OnlineStatus isOnline={true} size="sm" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-base font-semibold text-white">
                          {otherUser.full_name || otherUser.username}
                        </h1>
                        <p className="text-xs text-white/50">متصل الآن</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <CallButtons 
                      participant={{
                        id: otherUser.id,
                        username: otherUser.username || '',
                        full_name: otherUser.full_name || '',
                        avatar_url: otherUser.avatar_url || null,
                      }}
                      variant="purple"
                    />
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                      >
                        <Flag className="h-5 w-5 text-white/70" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
                
                <EnhancedChatWindow
                  messages={messages}
                  currentUserId={currentUser?.id}
                  otherUser={otherUser}
                  onSendMessage={handleSendMessage}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-background/80">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center px-6"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-purple-400/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20 backdrop-blur-md"
                  >
                    <MessageCircle className="w-12 h-12 text-purple-400" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">رسائلك</h2>
                  <p className="text-muted-foreground text-sm mb-4">ابدأ محادثة جديدة أو اختر من المحادثات الموجودة</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setShowNewMessageDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إرسال رسالة
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

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
