import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
}

interface InteractiveNotification {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data: NotificationData;
  actions: Array<{
    action: string;
    title: string;
    type: 'button' | 'text';
    placeholder?: string;
  }>;
}

export const useInteractiveNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  // تسجيل Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker مسجل بنجاح');
        })
        .catch((error) => {
          console.error('فشل في تسجيل Service Worker:', error);
        });
    }
  }, []);

  // طلب إذن الإشعارات
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "❌ غير مدعوم",
        description: "المتصفح لا يدعم الإشعارات",
        variant: "destructive"
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: "✅ تم التفعيل",
        description: "تم تفعيل الإشعارات التفاعلية بنجاح",
      });
      return true;
    } else {
      toast({
        title: "❌ مرفوض",
        description: "تم رفض أذونات الإشعارات",
        variant: "destructive"
      });
      return false;
    }
  };

  // إرسال إشعار تفاعلي
  const sendInteractiveNotification = async (notification: InteractiveNotification) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    if (!registration) {
      toast({
        title: "❌ خطأ",
        description: "Service Worker غير مسجل",
        variant: "destructive"
      });
      return;
    }

    // تحديد الإجراءات حسب نوع الإشعار
    const getActionsForType = (type: string) => {
      const baseActions = [
        {
          action: 'view',
          title: '👁️ عرض',
          type: 'button' as const
        }
      ];

      switch (type) {
        case 'like':
          return [
            {
              action: 'reply',
              title: '💬 رد',
              type: 'text' as const,
              placeholder: 'اكتب ردك...'
            },
            {
              action: 'like-back',
              title: '❤️ إعجاب متبادل',
              type: 'button' as const
            },
            ...baseActions
          ];
        
        case 'comment':
          return [
            {
              action: 'reply',
              title: '💬 رد',
              type: 'text' as const,
              placeholder: 'اكتب ردك...'
            },
            {
              action: 'like',
              title: '❤️ إعجاب',
              type: 'button' as const
            },
            ...baseActions
          ];
        
        case 'follow':
          return [
            {
              action: 'follow-back',
              title: '👥 متابعة متبادلة',
              type: 'button' as const
            },
            {
              action: 'message',
              title: '💌 رسالة',
              type: 'text' as const,
              placeholder: 'اكتب رسالة...'
            },
            ...baseActions
          ];
        
        case 'message':
          return [
            {
              action: 'reply',
              title: '💬 رد سريع',
              type: 'text' as const,
              placeholder: 'اكتب ردك...'
            },
            {
              action: 'emoji',
              title: '😊 رد بإيموجي',
              type: 'button' as const
            },
            ...baseActions
          ];
        
        default:
          return baseActions;
      }
    };

    // إرسال الإشعار
    const notificationOptions: any = {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      data: notification.data,
      tag: `${notification.data.type}-${notification.data.postId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      badge: '/favicon.ico',
      actions: getActionsForType(notification.data.type)
    };

    registration.showNotification(notification.title, notificationOptions);
  };

  // إشعارات للأنواع المختلفة
  const notificationTemplates = {
    like: (data: NotificationData) => ({
      title: `❤️ إعجاب جديد`,
      body: `أعجب ${data.userName} بمنشورك`,
      icon: data.userAvatar,
      data,
      actions: []
    }),

    comment: (data: NotificationData) => ({
      title: `💬 تعليق جديد`,
      body: `علق ${data.userName}: ${data.content.substring(0, 50)}...`,
      icon: data.userAvatar,
      data,
      actions: []
    }),

    follow: (data: NotificationData) => ({
      title: `👥 متابع جديد`,
      body: `${data.userName} بدأ في متابعتك`,
      icon: data.userAvatar,
      data,
      actions: []
    }),

    mention: (data: NotificationData) => ({
      title: `📢 إشارة جديدة`,
      body: `أشار إليك ${data.userName} في منشور`,
      icon: data.userAvatar,
      data,
      actions: []
    }),

    message: (data: NotificationData) => ({
      title: `💌 رسالة جديدة`,
      body: `${data.userName}: ${data.content.substring(0, 50)}...`,
      icon: data.userAvatar,
      image: data.image,
      data,
      actions: []
    })
  };

  // إرسال إشعار حسب النوع
  const sendNotificationByType = (type: keyof typeof notificationTemplates, data: NotificationData) => {
    const template = notificationTemplates[type];
    const notification = template(data);
    sendInteractiveNotification(notification);
  };

  // محاكاة الإشعارات للاختبار
  const sendTestNotification = (type: keyof typeof notificationTemplates) => {
    const testData: NotificationData = {
      postId: 'test-123',
      userId: 'user-456',
      userName: 'أحمد محمد',
      userAvatar: '/placeholder.svg',
      content: 'هذا محتوى تجريبي للاختبار والتطوير',
      image: type === 'message' ? '/placeholder.svg' : undefined,
      type
    };

    sendNotificationByType(type, testData);
  };

  return {
    permission,
    registration,
    requestPermission,
    sendInteractiveNotification,
    sendNotificationByType,
    sendTestNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};