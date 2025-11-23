import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Conversation } from '@/hooks/useMessages';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserId?: string;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUserId
}: ConversationListProps) => {
  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const otherUser = conv.participants?.[0];
        const isSelected = conv.id === selectedConversationId;
        const hasUnread = (conv.unread_count || 0) > 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors ${
              isSelected ? 'bg-accent' : ''
            }`}
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/70">
                <img
                  src={otherUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                  alt={otherUser?.username || 'مستخدم'}
                  className="w-full h-full object-cover"
                />
              </div>
              {hasUnread && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold text-sm truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                  {otherUser?.username || otherUser?.full_name || 'مستخدم'}
                </p>
                {conv.last_message && (
                  <span className="text-xs text-muted-foreground shrink-0 mr-2">
                    {formatDistanceToNow(new Date(conv.last_message.created_at), {
                      addSuffix: false,
                      locale: ar
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {conv.last_message?.media_type
                    ? conv.last_message.media_type === 'image'
                      ? '📷 صورة'
                      : '🎥 فيديو'
                    : conv.last_message?.content || 'لا توجد رسائل'}
                </p>
                {hasUnread && (
                  <Badge className="bg-primary text-primary-foreground text-xs px-2 h-5 shrink-0">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {conversations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>لا توجد محادثات بعد</p>
          <p className="text-sm mt-2">ابدأ محادثة جديدة من صفحة المستخدم</p>
        </div>
      )}
    </div>
  );
};
