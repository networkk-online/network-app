import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import { ArrowRight, Heart, MessageCircle, UserPlus, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Heart className="w-4 h-4 text-red-400" strokeWidth={1.4} />;
    case 'comment': return <MessageCircle className="w-4 h-4 text-blue-400" strokeWidth={1.4} />;
    case 'follow': return <UserPlus className="w-4 h-4 text-primary" strokeWidth={1.4} />;
    default: return <Gift className="w-4 h-4 text-amber-400" strokeWidth={1.4} />;
  }
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  index
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  index: number;
}) => {
  const navigate = useNavigate();
  const actorName = notification.actor?.username || notification.actor?.full_name || 'مستخدم';
  
  const getMessage = () => {
    switch (notification.type) {
      case 'like': return `أعجب ${actorName} بمنشورك`;
      case 'comment': return `علق ${actorName}: ${notification.content?.slice(0, 50)}${notification.content && notification.content.length > 50 ? '...' : ''}`;
      case 'follow': return `بدأ ${actorName} بمتابعتك`;
      default:
        if (notification.content) {
          try {
            const data = JSON.parse(notification.content);
            if (data.donor_username) return `تلقيت دعم بقيمة ${data.creator_earning || data.amount} دينار من ${data.donor_username}`;
          } catch {}
          return `${actorName}: ${notification.content.slice(0, 50)}${notification.content.length > 50 ? '...' : ''}`;
        }
        return 'إشعار جديد';
    }
  };

  const handleClick = () => {
    if (!notification.is_read) onMarkAsRead(notification.id);
    if (notification.post_id) navigate('/');
    else if (notification.type === 'follow') navigate(`/profile/${notification.actor_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={handleClick}
      className={`px-4 py-3.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${
        !notification.is_read ? 'bg-white/[0.02]' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={notification.actor?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={actorName}
            className="w-11 h-11 rounded-full object-cover ring-[1px] ring-white/[0.06]"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80 leading-relaxed">{getMessage()}</p>
          <p className="text-[11px] text-white/25 mt-0.5">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
               style={{ boxShadow: '0 0 6px hsla(144, 90%, 33%, 0.5)' }} />
        )}
      </div>
    </motion.div>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (!loading && unreadCount > 0) markAllAsRead();
  }, [loading]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="pt-16 pb-20">
        <div className="container-responsive max-w-2xl mx-auto">
          {/* Sticky Header */}
          <div className="sticky top-16 z-10 bg-black/80 backdrop-blur-[30px] border-b border-white/[0.04]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="lg:hidden hover:bg-white/[0.04] rounded-full"
                >
                  <ArrowRight className="w-5 h-5 text-white/60" strokeWidth={1.4} />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-white/95 tracking-wide">الإشعارات</h1>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-white/25">{unreadCount} إشعار غير مقروء</p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-primary/70 hover:text-primary hover:bg-white/[0.03]"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[calc(100vh-180px)]">
            {loading ? (
              <div className="p-12 text-center text-white/20">جاري التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-white/20 mb-2">لا توجد إشعارات</div>
                <p className="text-sm text-white/10">سيظهر هنا جميع الإشعارات الخاصة بك</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {notifications.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    index={index}
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
