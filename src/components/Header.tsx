import { Heart, Home, MessageCircle, PlusSquare, Search, Video, Building2, Users, LogOut, Film, Compass, Menu, Brain, Wallet, Shield, Crown, Settings, Bell } from 'lucide-react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
        loadProfile(user.id);
        loadUnreadCounts(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadProfile(session.user.id);
        loadUnreadCounts(session.user.id);
      } else {
        setIsAdmin(false);
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

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'moderator'])
      .maybeSingle();
    
    setIsAdmin(!!data);
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

  const handleLogout = async () => {
    // تسجيل بيانات الخروج في الخلفية قبل تسجيل الخروج
    logLogout(user?.id);
    
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
    navigate('/login');
  };

  // Mock user data - in a real app this would come from context/store
  const userData = {
    username: user?.user_metadata?.username || 'your_username',
    displayName: user?.user_metadata?.full_name || 'Your Name', 
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || '/default-avatar.jpg',
    followers: 1248,
    following: 567,
    posts: 127,
    bio: 'Content Creator | Digital Artist\nEarning through creativity 💚\nJoin the Network revolution!'
  };

  const navigationItems = [
    { icon: MessageCircle, label: 'الرسائل', path: '/messages', showBadge: true },
    { icon: Video, label: 'البث', path: '/broadcast' },
    { icon: Settings, label: 'الإعدادات', path: '/settings' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <div className="container-responsive px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
              <img 
                src={logo} 
                alt="Network Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold neon-text">Network</h1>
          </div>

          {/* Search Bar - Hidden on mobile, visible on tablet+ */}
          <div 
            className="hidden md:flex items-center bg-gray-900 rounded-lg px-3 py-2 w-48 lg:w-64 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => navigate('/search')}
          >
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text"
              readOnly
              placeholder="بحث..." 
              className="bg-transparent text-white placeholder-gray-400 outline-none flex-1 text-sm"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900 relative"
              onClick={() => navigate('/notifications')}
              title="الإشعارات"
            >
              <Bell className="w-5 h-5 xl:w-6 xl:h-6" />
              {unreadNotifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Button>
            {navigationItems.map((item, index) => (
              <Button 
                key={index}
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-gray-900 relative" 
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon className="w-5 h-5 xl:w-6 xl:h-6" />
                {item.showBadge && unreadMessages > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
                  >
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </Button>
            ))}
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-green-900"
                onClick={() => navigate('/admin')}
                title="لوحة التحكم"
              >
                <Shield className="w-5 h-5 xl:w-6 xl:h-6 text-green-400" />
              </Button>
            )}
            {user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-red-900"
                onClick={handleLogout}
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5 xl:w-6 xl:h-6 text-red-400" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-gray-900"
                onClick={() => navigate('/login')}
                title="تسجيل الدخول"
              >
                <LogOut className="w-5 h-5 xl:w-6 xl:h-6" />
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center space-x-2 sm:space-x-3">
            {/* Key actions for mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900 relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900 relative"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs border-0 rounded-full"
                >
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
