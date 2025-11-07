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
    <div className="space-y-1">
      {conversations.map((conv) => {
        const otherUser = conv.participants?.[0];
        const isSelected = conv.id === selectedConversationId;
        const hasUnread = (conv.unread_count || 0) > 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-800/50 transition-colors ${
              isSelected ? 'bg-gray-800' : ''
            }`}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage
                src={otherUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                alt={otherUser?.username || 'مستخدم'}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow">
                {(otherUser?.username || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold text-sm ${hasUnread ? 'text-white' : 'text-gray-300'}`}>
                  {otherUser?.username || otherUser?.full_name || 'مستخدم'}
                </p>
                {conv.last_message && (
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(conv.last_message.created_at), {
                      addSuffix: true,
                      locale: ar
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${hasUnread ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {conv.last_message?.media_type
                    ? conv.last_message.media_type === 'image'
                      ? '📷 صورة'
                      : '🎥 فيديو'
                    : conv.last_message?.content || 'لا توجد رسائل'}
                </p>
                {hasUnread && (
                  <Badge className="bg-primary text-white text-xs px-2">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {conversations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>لا توجد محادثات بعد</p>
          <p className="text-sm mt-2">ابدأ محادثة جديدة من صفحة المستخدم</p>
        </div>
      )}
    </div>
  );
};
