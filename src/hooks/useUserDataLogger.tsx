import { supabase } from '@/integrations/supabase/client';

export const logUserAction = async (action: 'login' | 'logout', userId?: string) => {
  try {
    // إرسال الطلب في الخلفية بدون انتظار الرد
    supabase.functions.invoke('log-user-data', {
      body: { 
        action,
        user_id: userId || 'anonymous'
      }
    }).catch((error) => {
      console.error('Background logging failed:', error);
    });
  } catch (error) {
    // لا نريد أن يؤثر الخطأ على تجربة المستخدم
    console.error('Failed to log user action:', error);
  }
};

export const useUserDataLogger = () => {
  const logLogin = (userId?: string) => {
    logUserAction('login', userId);
  };

  const logLogout = (userId?: string) => {
    logUserAction('logout', userId);
  };

  return { logLogin, logLogout };
};
