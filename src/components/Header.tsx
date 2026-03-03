import { MessageCircle, Search, Video, Settings, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserDataLogger } from '@/hooks/useUserDataLogger';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import logo from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logLogout } = useUserDataLogger();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  useEffect(() => {
    if (!user) return;

    const notificationsChannel = supabase
      .channel('header-notifications-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => loadUnreadCounts(user.id))
      .subscribe();

    const messagesChannel = supabase
      .channel('header-messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadUnreadCounts(user.id))
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
  };

  const loadUnreadCounts = async (userId: string) => {
    const { count: notifCount } = await supabase
      .from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    setUnreadNotifications(notifCount || 0);

    const { data: conversations } = await supabase
      .from('conversation_participants').select('conversation_id, last_read_at').eq('user_id', userId);
    if (conversations) {
      let totalUnread = 0;
      for (const conv of conversations) {
        const { count } = await supabase
          .from('messages').select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.conversation_id).neq('sender_id', userId)
          .gt('created_at', conv.last_read_at || '1970-01-01');
        totalUnread += count || 0;
      }
      setUnreadMessages(totalUnread);
    }
  };

  const handleLogout = async () => {
    logLogout(user?.id);
    await supabase.auth.signOut();
    toast({ title: "تم تسجيل الخروج", description: "تم تسجيل خروجك بنجاح" });
    navigate('/login');
  };

  const navigationItems = [
    { icon: MessageCircle, label: 'الرسائل', path: '/messages', showBadge: true },
    { icon: Video, label: 'البث', path: '/broadcast' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-area-top bg-black/70 backdrop-blur-[30px] border-b border-white/[0.04]"
            style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
      <div className="container-responsive px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 sm:w-8 sm:h-8">
              <img src={logo} alt="Network Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight"
                style={{ textShadow: '0 0 20px hsla(144, 90%, 33%, 0.2)' }}>
              Network
            </h1>
          </div>

          {/* Search — Desktop */}
          <div
            className="hidden md:flex items-center glass-input px-4 py-2 w-48 lg:w-64 cursor-pointer"
            onClick={() => navigate('/search')}
          >
            <Search className="w-4 h-4 text-white/30 mr-2" strokeWidth={1.4} />
            <input type="text" readOnly placeholder="بحث..." className="bg-transparent text-foreground placeholder-white/25 outline-none flex-1 text-sm" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/[0.04] relative interactive-element" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5 text-white/60" strokeWidth={1.4} />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center px-1 bg-destructive text-destructive-foreground text-[10px] border-0 rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Button>
            {navigationItems.map((item, index) => (
              <Button key={index} variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/[0.04] relative interactive-element" onClick={() => navigate(item.path)}>
                <item.icon className="w-5 h-5 text-white/60" strokeWidth={1.4} />
                {item.showBadge && unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center px-1 bg-destructive text-destructive-foreground text-[10px] border-0 rounded-full">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </Button>
            ))}
            {user ? (
              <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-destructive/10 interactive-element" onClick={handleLogout}>
                <LogOut className="w-5 h-5 text-destructive/70" strokeWidth={1.4} />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/[0.04] interactive-element" onClick={() => navigate('/login')}>
                <LogOut className="w-5 h-5 text-white/60" strokeWidth={1.4} />
              </Button>
            )}
          </div>

          {/* Mobile Nav */}
          <div className="flex lg:hidden items-center gap-1">
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/[0.04] relative interactive-element" onClick={() => navigate('/notifications')}>
              <Bell className="w-5 h-5 text-white/60" strokeWidth={1.4} />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center px-1 bg-destructive text-destructive-foreground text-[10px] border-0 rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-white/[0.04] relative interactive-element" onClick={() => navigate('/messages')}>
              <MessageCircle className="w-5 h-5 text-white/60" strokeWidth={1.4} />
              {unreadMessages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center px-1 bg-destructive text-destructive-foreground text-[10px] border-0 rounded-full">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
