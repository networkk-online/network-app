import { Home, PlusSquare, Search, Film, User, Bell, Trophy, Compass, Users, FileText, Smartphone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id);
        loadUnreadCounts(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        loadUnreadCounts(session.user.id);
      } else {
        setProfile(null);
        setUnreadNotifications(0);
        setUnreadMessages(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time updates for notifications and messages
  useEffect(() => {
    if (!user) return;

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => loadUnreadCounts(user.id)
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => loadUnreadCounts(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
    }
  };

  const loadUnreadCounts = async (userId: string) => {
    // Get unread notifications count
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setUnreadNotifications(notifCount || 0);

    // Get unread messages count
    const { data: conversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (conversations) {
      let totalUnread = 0;
      for (const conv of conversations) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id)
          .neq('sender_id', userId)
          .gt('created_at', conv.last_read_at || '1970-01-01');
        
        totalUnread += count || 0;
      }
      setUnreadMessages(totalUnread);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Compass, label: 'استكشف', path: '/explore', badge: 0 },
    { icon: Search, label: 'بحث', path: '/search', badge: 0 },
    { icon: Film, label: 'ريلز', path: '/shorts', badge: 0 },
    { icon: Users, label: 'مجتمع', path: '/pages', badge: 0 },
    { icon: FileText, label: 'صفحات', path: '/pages', badge: 0 },
    { icon: Smartphone, label: 'تطبيق', path: '/', badge: 0 },
    { icon: Bell, label: 'إشعارات', path: '/', badge: unreadNotifications },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-border">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center min-w-[60px] group relative"
            >
              <Icon 
                className={`w-7 h-7 transition-colors ${
                  active 
                    ? 'text-primary' 
                    : 'text-white group-hover:text-primary'
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
              {item.badge > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </button>
          );
        })}
        
        {/* Notifications Button */}
        <button
          onClick={() => navigate('/')} 
          className="flex flex-col items-center justify-center min-w-[60px] group relative"
        >
          <Bell 
            className={`w-7 h-7 transition-colors ${
              isActive('/notifications') 
                ? 'text-primary' 
                : 'text-white group-hover:text-primary'
            }`}
            strokeWidth={isActive('/notifications') ? 2.5 : 2}
          />
          {unreadNotifications > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
            >
              {unreadNotifications > 99 ? '99+' : unreadNotifications}
            </Badge>
          )}
        </button>
        
        {/* Profile Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center min-w-[60px] group relative"
        >
          {user ? (
            <Avatar className={`w-7 h-7 ring-2 transition-all ${
              isActive('/profile') 
                ? 'ring-primary' 
                : 'ring-transparent group-hover:ring-primary'
            }`}>
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <User 
              className={`w-7 h-7 transition-colors ${
                isActive('/profile') 
                  ? 'text-primary' 
                  : 'text-white group-hover:text-primary'
              }`}
            />
          )}
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
