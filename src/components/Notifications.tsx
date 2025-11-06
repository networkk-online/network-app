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
      case 'like':
        return `أعجب ${actorName} بمنشورك`;
      case 'comment':
        return `علق ${actorName}: ${notification.content?.slice(0, 50)}${notification.content && notification.content.length > 50 ? '...' : ''}`;
      case 'follow':
        return `بدأ ${actorName} بمتابعتك`;
      default:
        return 'إشعار جديد';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    // Navigate to post if available
    if (notification.post_id) {
      navigate('/');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border last:border-0 ${
        !notification.is_read ? 'bg-accent/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={notification.actor?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          alt={actorName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{getMessage()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true,
              locale: ar 
            })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-auto py-1 px-2"
            >
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد إشعارات
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
