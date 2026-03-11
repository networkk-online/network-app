import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const actorName = notification.actor?.username || notification.actor?.full_name || 'مستخدم';
  
  const getMessage = () => {
    switch (notification.type) {
      case 'like': return `أعجب ${actorName} بمنشورك`;
      case 'comment': return `علق ${actorName}: ${notification.content?.slice(0, 50)}${notification.content && notification.content.length > 50 ? '...' : ''}`;
      case 'follow': return `بدأ ${actorName} بمتابعتك`;
      case 'transaction': return notification.content || 'عملية مالية جديدة';
      case 'tip': return notification.content || 'إكرامية جديدة';
      case 'donation': return notification.content || 'دعم جديد';
      default: return notification.content || 'إشعار جديد';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) onMarkAsRead(notification.id);
    if (notification.post_id) navigate('/');
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${
        !notification.is_read ? 'bg-white/[0.02]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={notification.actor?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          alt={actorName}
          className="w-10 h-10 rounded-full object-cover ring-[1px] ring-white/[0.06]"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/75">{getMessage()}</p>
          <p className="text-[11px] text-white/25 mt-0.5">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"
               style={{ boxShadow: '0 0 6px hsla(144, 90%, 33%, 0.5)' }} />
        )}
      </div>
    </div>
  );
};

export const Notifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-white/[0.04]">
          <Bell className="w-5 h-5 text-white/60" strokeWidth={1.4} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium"
                  style={{ boxShadow: '0 0 8px hsla(144, 90%, 33%, 0.4)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-black/90 backdrop-blur-[35px] border-white/[0.08] rounded-2xl overflow-hidden" align="end"
                       style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <h3 className="font-semibold text-white/90 text-sm">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[11px] h-auto py-1 px-2 text-primary/60 hover:text-primary hover:bg-white/[0.03]">
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-white/20 text-sm">جاري التحميل...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-white/15 text-sm">لا توجد إشعارات</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
