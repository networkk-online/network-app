import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import { ArrowRight } from 'lucide-react';

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
        // Handle other notification types like reply, donation, etc.
        if (notification.content) {
          try {
            const data = JSON.parse(notification.content);
            if (data.donor_username) {
              return `تلقيت دعم بقيمة ${data.creator_earning || data.amount} دينار من ${data.donor_username}`;
            }
          } catch {
            // If parsing fails, treat as regular notification
          }
          return `${actorName}: ${notification.content.slice(0, 50)}${notification.content.length > 50 ? '...' : ''}`;
        }
        return 'إشعار جديد';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    // Navigate to relevant page
    if (notification.post_id) {
      navigate('/');
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border last:border-0 ${
        !notification.is_read ? 'bg-accent/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <img
          src={notification.actor?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
          alt={actorName}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">{getMessage()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true,
              locale: ar 
            })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  // Auto-mark all notifications as read when page opens
  useEffect(() => {
    if (!loading && unreadCount > 0) {
      markAllAsRead();
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16 pb-20">
        <div className="container-responsive max-w-2xl mx-auto">
          {/* Header */}
          <div className="sticky top-16 z-10 bg-background border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="lg:hidden"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">الإشعارات</h1>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground">{unreadCount} إشعار غير مقروء</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-180px)]">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-muted-foreground mb-2">لا توجد إشعارات</div>
                <p className="text-sm text-muted-foreground">
                  سيظهر هنا جميع الإشعارات الخاصة بك
                </p>
              </div>
            ) : (
              <div className="bg-card">
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
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
