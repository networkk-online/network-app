import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed,
  PermissionStatus
} from '@capacitor/push-notifications';

interface PushNotificationState {
  token: string | null;
  notification: PushNotificationSchema | null;
  error: string | null;
}

export const useNativePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    notification: null,
    error: null,
  });

  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async (): Promise<PermissionStatus> => {
    if (!isNative) {
      return { receive: 'granted' } as PermissionStatus;
    }
    return await PushNotifications.checkPermissions();
  }, [isNative]);

  const requestPermissions = useCallback(async (): Promise<PermissionStatus> => {
    if (!isNative) {
      return { receive: 'granted' } as PermissionStatus;
    }
    return await PushNotifications.requestPermissions();
  }, [isNative]);

  const register = useCallback(async (): Promise<void> => {
    if (!isNative) {
      console.log('Push notifications are only available on native platforms');
      return;
    }

    try {
      // Request permission
      const permStatus = await requestPermissions();
      
      if (permStatus.receive !== 'granted') {
        setState(prev => ({ ...prev, error: 'تم رفض إذن الإشعارات' }));
        return;
      }

      // Register with Apple/Google to receive push
      await PushNotifications.register();
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'فشل التسجيل' }));
      console.error('Error registering push notifications:', error);
    }
  }, [isNative, requestPermissions]);

  const addListeners = useCallback(() => {
    if (!isNative) return;

    // On registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({ ...prev, token: token.value, error: null }));
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({ ...prev, error: error.error }));
    });

    // Show notification when received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      setState(prev => ({ ...prev, notification }));
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      // Handle navigation based on notification data
      const data = action.notification.data;
      if (data?.route) {
        // Navigate to the specified route
        window.location.href = data.route;
      }
    });
  }, [isNative]);

  const removeListeners = useCallback(async () => {
    if (!isNative) return;
    await PushNotifications.removeAllListeners();
  }, [isNative]);

  const getDeliveredNotifications = useCallback(async () => {
    if (!isNative) return [];
    const result = await PushNotifications.getDeliveredNotifications();
    return result.notifications;
  }, [isNative]);

  const removeDeliveredNotifications = useCallback(async (notifications: PushNotificationSchema[]) => {
    if (!isNative) return;
    await PushNotifications.removeDeliveredNotifications({ notifications });
  }, [isNative]);

  const removeAllDeliveredNotifications = useCallback(async () => {
    if (!isNative) return;
    await PushNotifications.removeAllDeliveredNotifications();
  }, [isNative]);

  useEffect(() => {
    if (isNative) {
      addListeners();
      register();
    }

    return () => {
      removeListeners();
    };
  }, [isNative, addListeners, register, removeListeners]);

  return {
    ...state,
    isNative,
    register,
    checkPermissions,
    requestPermissions,
    getDeliveredNotifications,
    removeDeliveredNotifications,
    removeAllDeliveredNotifications,
  };
};
