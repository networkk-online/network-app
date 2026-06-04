import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Megaphone, Coins, Film } from 'lucide-react';
import { createElement } from 'react';

/**
 * Realtime notification system.
 * - Subscribes to public.system_broadcasts (admin broadcasts) for ALL users.
 * - Subscribes to public.notifications inserts for the logged-in user.
 * Shows glassmorphic neon-green sonner toasts.
 */
export function useRealtimeNotifications() {
  const userIdRef = useRef<string | null>(null);
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    let broadcastChannel: ReturnType<typeof supabase.channel> | null = null;
    let userChannel: ReturnType<typeof supabase.channel> | null = null;

    const baseToastStyle = {
      background: 'linear-gradient(135deg, rgba(8,12,18,0.95) 0%, rgba(2,6,10,0.98) 100%)',
      border: '1px solid rgba(0,255,102,0.35)',
      boxShadow: '0 0 30px rgba(0,255,102,0.20), inset 0 1px 0 rgba(255,255,255,0.04)',
      backdropFilter: 'blur(24px)',
      color: '#e7ffe9',
    } as React.CSSProperties;

    const showBroadcast = (b: { title: string; body: string; variant?: string }) => {
      toast(b.title, {
        description: b.body,
        duration: 7000,
        icon: createElement(Megaphone, { className: 'w-5 h-5', style: { color: '#00ff66' } }),
        style: baseToastStyle,
      });
    };

    const showUserNotification = (n: { type: string; content?: string | null }) => {
      let title = 'إشعار جديد';
      let Icon: any = Bell;
      switch (n.type) {
        case 'topup':
        case 'earning':
        case 'transaction':
          title = '💰 رصيدك تحدّث';
          Icon = Coins;
          break;
        case 'deposit_request':
          title = '🧾 طلب تعبئة جديد';
          break;
        case 'cinema_new':
          title = '🎬 فيلم جديد في السينما';
          Icon = Film;
          break;
        case 'follow':
          title = '👤 متابع جديد';
          break;
      }
      toast(title, {
        description: n.content || undefined,
        duration: 6000,
        icon: createElement(Icon, { className: 'w-5 h-5', style: { color: '#00ff66' } }),
        style: baseToastStyle,
      });
    };

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      // Global broadcast channel
      broadcastChannel = supabase
        .channel('system_broadcasts_rt')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'system_broadcasts' },
          (payload) => {
            const row: any = payload.new;
            // Skip rows older than this mount (initial cache replay safety)
            if (row?.created_at && new Date(row.created_at).getTime() < mountedAt.current - 5000) return;
            showBroadcast({ title: row.title, body: row.body, variant: row.variant });
          }
        )
        .subscribe();

      if (user?.id) {
        userChannel = supabase
          .channel('notifications_rt_' + user.id)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const row: any = payload.new;
              if (row?.created_at && new Date(row.created_at).getTime() < mountedAt.current - 5000) return;
              showUserNotification({ type: row.type, content: row.content });
            }
          )
          .subscribe();
      }
    };

    setup();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      // Re-setup on auth changes
      if (userChannel) supabase.removeChannel(userChannel);
      mountedAt.current = Date.now();
      setup();
    });

    return () => {
      if (broadcastChannel) supabase.removeChannel(broadcastChannel);
      if (userChannel) supabase.removeChannel(userChannel);
      authListener?.subscription.unsubscribe();
    };
  }, []);
}
