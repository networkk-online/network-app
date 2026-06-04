import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

/** Headless component — mount once in App to enable realtime toast notifications. */
const RealtimeNotificationsMount = () => {
  useRealtimeNotifications();
  return null;
};

export default RealtimeNotificationsMount;
