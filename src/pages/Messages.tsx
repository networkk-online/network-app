import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Plus, Search, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { ConversationList } from '@/components/ConversationList';
import { EnhancedChatWindow } from '@/components/chat';
import { ChatHeaderMenu } from '@/components/chat/ChatHeaderMenu';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewMessageDialog } from '@/components/NewMessageDialog';
import BottomNav from '@/components/BottomNav';
import CallButtons from '@/components/CallButtons';
import { OnlineStatus } from '@/components/communication';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'primary' | 'requests' | 'general'>('all');
  const [isDragging, setIsDragging] = useState(false);
  
  // Swipe gesture motion values
  const dragX = useMotionValue(0);
  const swipeOpacity = useTransform(dragX, [0, 150], [0, 1]);
  
  const {
    conversations,
    messages,
    loading,
    currentUser,
    sendMessage,
    createConversation,
    loadConversations,
    deleteMessage,
    toggleReaction
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

  const handleSelectConversation = useCallback((conversationId: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setSelectedConversationId(conversationId);
  }, []);

  const handleBack = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    setSelectedConversationId(null);
  }, []);

  const handleSwipeBack = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > 100 && info.velocity.x > 0) {
      handleBack();
    }
  }, [handleBack]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x > 100 && info.velocity.x > 0) {
      handleBack();
    }
  }, [handleBack]);

  const handleSendMessage = async (content: string | null, mediaFile?: File, settings?: any) => {
    if (!selectedConversationId) return { success: false };
    return await sendMessage(selectedConversationId, content, mediaFile, settings);
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
      <div className="min-h-screen bg-black flex items-center justify-center safe-area-inset">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-[100dvh] bg-black overflow-hidden">
      <main className="messages-split-view">
        {/* Conversations List Panel - Always visible on desktop, hidden when chat selected on mobile */}
        <motion.div 
          initial={false}
          animate={{ 
            x: selectedConversationId ? '-100%' : 0,
            opacity: selectedConversationId ? 0 : 1
          }}
          transition={springConfig}
          className={`messages-list-panel flex flex-col bg-black safe-area-top ${
            selectedConversationId ? 'hidden md:flex' : 'flex'
          } md:translate-x-0 md:opacity-100`}
        >
          {/* Sticky Header with Safe Area */}
          <div className="sticky top-0 z-50 p-4 border-b border-white/10 backdrop-blur-xl bg-black/95 safe-area-top">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  transition={springConfig}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                    onClick={() => navigate('/')}
                  >
                    <ArrowRight className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
                <h1 className="text-xl font-bold text-white">الرسائل</h1>
              </div>
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                transition={springConfig}
              >
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

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الرسائل"
                className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl backdrop-blur-md focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Filters */}
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
                transition={springConfig}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground shadow-lg'
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

          {/* Conversations List with safe area bottom */}
          <div className="flex-1 overflow-y-auto safe-area-bottom">
            <ConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId || undefined}
              onSelectConversation={handleSelectConversation}
              currentUserId={currentUser?.id}
              onRefresh={loadConversations}
            />
          </div>
        </motion.div>

        {/* Chat Window Panel - Fullscreen on mobile, side panel on desktop */}
        <AnimatePresence mode="wait">
          {selectedConversationId && otherUser && (
            <motion.div 
              key="chat-window"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={springConfig}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.2 }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              style={{ x: dragX }}
              className="messages-chat-panel flex flex-col bg-black fixed inset-0 md:relative md:inset-auto z-50 md:z-auto overflow-hidden"
            >
              {/* Swipe Back Indicator */}
              <motion.div 
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 md:hidden"
                style={{ opacity: swipeOpacity }}
              >
                <div className="w-1 h-16 bg-white/30 rounded-full" />
              </motion.div>

              {/* Sticky Chat Header with Safe Area - shrink-0 to prevent compression */}
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={springConfig}
                className="shrink-0 sticky top-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-xl border-b border-white/10 bg-black/95 safe-area-top"
              >
                <div className="flex items-center gap-3">
                  {/* Back Button - Always visible and easy to reach */}
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    transition={springConfig}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 touch-manipulation"
                      onClick={handleBack}
                    >
                      <ArrowRight className="h-5 w-5 text-white" />
                    </Button>
                  </motion.div>
                  
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarImage src={otherUser.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm">
                          {otherUser.full_name?.charAt(0) || otherUser.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <OnlineStatus isOnline={true} size="sm" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-base font-semibold text-white truncate">
                        {otherUser.full_name || otherUser.username}
                      </h1>
                      <p className="text-xs text-white/50">متصل الآن</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {otherUser.id && (
                    <CallButtons 
                      participant={{
                        id: otherUser.id,
                        username: otherUser.username || '',
                        full_name: otherUser.full_name || '',
                        avatar_url: otherUser.avatar_url || null,
                      }}
                      variant="purple"
                    />
                  )}
                  <ChatHeaderMenu
                    otherUser={otherUser}
                    conversationId={selectedConversationId}
                    currentUserId={currentUser?.id}
                    onDeleted={() => {
                      handleBack();
                      loadConversations();
                    }}
                  />

                </div>
              </motion.div>
              
              {/* Chat Window - flex-1 min-h-0 to fill remaining space and enable scrolling */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <EnhancedChatWindow
                  messages={messages}
                  currentUserId={currentUser?.id}
                  conversationId={selectedConversationId}
                  otherUser={otherUser}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={deleteMessage}
                  onReaction={toggleReaction}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State for Desktop - Only when no conversation selected */}
        {!selectedConversationId && (
          <div className="hidden md:flex messages-chat-panel items-center justify-center bg-black">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center px-6"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 backdrop-blur-md"
              >
                <MessageCircle className="w-12 h-12 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground mb-2">رسائلك</h2>
              <p className="text-muted-foreground text-sm mb-4">ابدأ محادثة جديدة أو اختر من المحادثات الموجودة</p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setShowNewMessageDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إرسال رسالة
                </Button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Bottom Nav - Completely hidden in messages section */}
      <AnimatePresence>
        {!selectedConversationId && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={springConfig}
          >
            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>

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
