import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  token: string | null;
  isRegistered: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isRegistered: false,
    error: null,
  });
  const { toast } = useToast();

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Save token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: platform as 'android' | 'ios' | 'web',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token'
        });

      if (error) throw error;
      console.log('Push token saved to database');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }, [platform]);

  // Register for push notifications
  const register = useCallback(async () => {
    if (!isNative) {
      // For web, use service worker
      await registerWebPush();
      return;
    }

    try {
      // Check permissions
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setState(prev => ({ ...prev, error: 'تم رفض إذن الإشعارات' }));
        return;
      }

      // Register with Apple/Google
      await PushNotifications.register();

    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message || 'فشل التسجيل' }));
      console.error('Error registering push notifications:', error);
    }
  }, [isNative]);

  // Register web push notifications
  const registerWebPush = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported in this browser');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await (registration as any).pushManager?.getSubscription();
      
      if (!subscription) {
        // For web push, we'll use the service worker for local notifications
        // Real push notifications would require a VAPID key setup
        console.log('Web push: Using local notifications via service worker');
      }

      // Use a unique identifier for web
      const token = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setState(prev => ({ ...prev, token, isRegistered: true }));
      await saveTokenToDatabase(token);

    } catch (error: any) {
      console.error('Error registering web push:', error);
    }
  }, [saveTokenToDatabase]);

  // Add native listeners
  const addListeners = useCallback(() => {
    if (!isNative) return;

    // On registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({ ...prev, token: token.value, isRegistered: true, error: null }));
      await saveTokenToDatabase(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({ ...prev, error: error.error }));
    });

    // Notification received in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      
      // Handle incoming call notification
      const data = notification.data;
      if (data?.type === 'incoming_call') {
        // The CallProvider will handle this via realtime
        toast({
          title: notification.title || 'مكالمة واردة',
          description: notification.body,
        });
      }
    });

    // Notification tapped
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      const data = action.notification.data;
      
      if (data?.type === 'incoming_call' && data?.route) {
        window.location.href = data.route;
      }
    });
  }, [isNative, saveTokenToDatabase, toast]);

  // Remove token from database on logout
  const removeToken = useCallback(async () => {
    if (!state.token) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', state.token);

      if (isNative) {
        await PushNotifications.removeAllListeners();
      }

      setState({ token: null, isRegistered: false, error: null });
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }, [state.token, isNative]);

  useEffect(() => {
    addListeners();
    register();

    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [addListeners, register, isNative]);

  return {
    ...state,
    isNative,
    platform,
    register,
    removeToken,
  };
};
