import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Conversation } from '@/hooks/useMessages';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Pin, Archive, Trash2, BellOff, MoreHorizontal, Check, CheckCheck, Image, Video, Mic } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserId?: string;
  onRefresh?: () => void;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId,
  onRefresh
}: ConversationListProps) => {
  const { toast } = useToast();
  const [swipedId, setSwipedId] = useState<string | null>(null);

  const handlePin = async (conversationId: string, isPinned: boolean) => {
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('pinned_by')
        .eq('id', conversationId)
        .single();
      
      let newPinnedBy = conv?.pinned_by || [];
      if (isPinned) {
        newPinnedBy = newPinnedBy.filter((id: string) => id !== currentUserId);
      } else {
        newPinnedBy = [...newPinnedBy, currentUserId];
      }

      await supabase
        .from('conversations')
        .update({ pinned_by: newPinnedBy })
        .eq('id', conversationId);

      toast({
        title: isPinned ? 'تم إلغاء التثبيت' : 'تم التثبيت',
        description: isPinned ? 'تم إلغاء تثبيت المحادثة' : 'تم تثبيت المحادثة في الأعلى',
      });
      
      onRefresh?.();
      setSwipedId(null);
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
  };

  const handleArchive = async (conversationId: string, isArchived: boolean) => {
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('archived_by')
        .eq('id', conversationId)
        .single();
      
      let newArchivedBy = conv?.archived_by || [];
      if (isArchived) {
        newArchivedBy = newArchivedBy.filter((id: string) => id !== currentUserId);
      } else {
        newArchivedBy = [...newArchivedBy, currentUserId];
      }

      await supabase
        .from('conversations')
        .update({ archived_by: newArchivedBy })
        .eq('id', conversationId);

      toast({
        title: isArchived ? 'تم إلغاء الأرشفة' : 'تم الأرشفة',
        description: isArchived ? 'تم إرجاع المحادثة' : 'تم أرشفة المحادثة',
      });
      
      onRefresh?.();
      setSwipedId(null);
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const handleDelete = async (conversationId: string) => {
    try {
      // Delete all messages in conversation for this user
      await supabase
        .from('messages')
        .update({ deleted_for_sender: true })
        .eq('conversation_id', conversationId)
        .eq('sender_id', currentUserId);

      await supabase
        .from('messages')
        .update({ deleted_for_receiver: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId);

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المحادثة',
      });
      
      onRefresh?.();
      setSwipedId(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const getMessagePreview = (conv: Conversation) => {
    const lastMessage = conv.last_message;
    if (!lastMessage) return 'ابدأ المحادثة';
    
    if (lastMessage.media_type === 'image') {
      return (
        <span className="flex items-center gap-1">
          <Image className="h-3.5 w-3.5" />
          صورة
        </span>
      );
    }
    if (lastMessage.media_type === 'video') {
      return (
        <span className="flex items-center gap-1">
          <Video className="h-3.5 w-3.5" />
          فيديو
        </span>
      );
    }
    if (lastMessage.media_type === 'voice') {
      return (
        <span className="flex items-center gap-1">
          <Mic className="h-3.5 w-3.5" />
          رسالة صوتية
        </span>
      );
    }
    
    return lastMessage.content || 'رسالة';
  };

  const getMessageStatus = (conv: Conversation) => {
    const lastMessage = conv.last_message;
    if (!lastMessage || lastMessage.sender_id !== currentUserId) return null;
    
    if (lastMessage.is_read) {
      return <CheckCheck className="h-4 w-4 text-blue-400" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
  };

  // Sort conversations: pinned first, then by last message time
  const sortedConversations = [...conversations].sort((a, b) => {
    const aIsPinned = a.pinned_by?.includes(currentUserId || '') || false;
    const bIsPinned = b.pinned_by?.includes(currentUserId || '') || false;
    
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    
    const aTime = a.last_message?.created_at || a.updated_at;
    const bTime = b.last_message?.created_at || b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  // Filter out archived conversations
  const visibleConversations = sortedConversations.filter(
    conv => !conv.archived_by?.includes(currentUserId || '')
  );

  const handleDragEnd = (conversationId: string, info: PanInfo) => {
    if (info.offset.x < -100) {
      setSwipedId(conversationId);
    } else {
      setSwipedId(null);
    }
  };

  return (
    <div className="divide-y divide-border">
      {visibleConversations.map((conv) => {
        const otherUser = conv.participants?.[0];
        const isSelected = conv.id === selectedConversationId;
        const hasUnread = (conv.unread_count || 0) > 0;
        const isPinned = conv.pinned_by?.includes(currentUserId || '') || false;
        const isSwiped = swipedId === conv.id;

        return (
          <div key={conv.id} className="relative overflow-hidden">
            {/* Swipe Actions Background */}
            <AnimatePresence>
              {isSwiped && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600"
                    onClick={() => handlePin(conv.id, isPinned)}
                  >
                    <Pin className="h-5 w-5 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-yellow-500 hover:bg-yellow-600"
                    onClick={() => handleArchive(conv.id, false)}
                  >
                    <Archive className="h-5 w-5 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600"
                    onClick={() => handleDelete(conv.id)}
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation Item */}
            <motion.div
              drag="x"
              dragConstraints={{ left: -150, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => handleDragEnd(conv.id, info)}
              animate={{ x: isSwiped ? -150 : 0 }}
              className="bg-background"
            >
              <button
                onClick={() => {
                  if (!isSwiped) {
                    onSelectConversation(conv.id);
                  } else {
                    setSwipedId(null);
                  }
                }}
                className={`w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors ${
                  isSelected ? 'bg-accent' : ''
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative shrink-0">
                  <Avatar className="w-14 h-14 border-2 border-transparent">
                    <AvatarImage 
                      src={otherUser?.avatar_url || '/default-avatar.jpg'} 
                      alt={otherUser?.username || 'مستخدم'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg">
                      {otherUser?.username?.charAt(0) || otherUser?.full_name?.charAt(0) || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator - can be connected to presence later */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-right">
                  {/* Top Row: Name, Pin, Time */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isPinned && (
                        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      <p className={`font-semibold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                        {otherUser?.full_name || otherUser?.username || 'مستخدم'}
                      </p>
                      {otherUser?.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mr-2">
                      {getMessageStatus(conv)}
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), {
                            addSuffix: false,
                            locale: ar
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Message Preview, Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate flex items-center gap-1 ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {getMessagePreview(conv)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasUnread && (
                        <Badge className="bg-primary text-primary-foreground text-xs px-2 h-5 min-w-[20px] flex items-center justify-center">
                          {conv.unread_count}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handlePin(conv.id, isPinned)}>
                            <Pin className="h-4 w-4 ml-2" />
                            {isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BellOff className="h-4 w-4 ml-2" />
                            كتم الإشعارات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(conv.id, false)}>
                            <Archive className="h-4 w-4 ml-2" />
                            أرشفة
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDelete(conv.id)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>
        );
      })}

      {visibleConversations.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد محادثات</h3>
          <p className="text-muted-foreground text-sm">
            ابدأ محادثة جديدة مع أصدقائك
          </p>
        </div>
      )}
    </div>
  );
};
