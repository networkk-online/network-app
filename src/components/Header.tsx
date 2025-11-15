import { Heart, Home, MessageCircle, PlusSquare, Search, Video, Building2, Users, LogOut, Film, Compass, Menu, Brain, Wallet, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import logo from '@/assets/logo.png';
import { Notifications } from '@/components/Notifications';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkAdminStatus(user.id);
        loadProfile(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadProfile(session.user.id);
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleLogout = async () => {
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
    avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    followers: 1248,
    following: 567,
    posts: 127,
    bio: 'Content Creator | Digital Artist\nEarning through creativity 💚\nJoin the Network revolution!'
  };

  const navigationItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Compass, label: 'استكشف', path: '/explore' },
    { icon: Brain, label: 'أدوات AI', path: '/ai-tools' },
    { icon: Film, label: 'الريلز', path: '/shorts' },
    { icon: MessageCircle, label: 'الرسائل', path: '/messages' },
    { icon: Video, label: 'البث', path: '/broadcast' },
    { icon: Users, label: 'الصفحات', path: '/pages' },
    { icon: Building2, label: 'الأعمال', path: '/business' },
    { icon: Wallet, label: 'سحب المال', path: '/withdraw' },
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
            {navigationItems.map((item, index) => (
              <Button 
                key={index}
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-gray-900" 
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon className="w-5 h-5 xl:w-6 xl:h-6" />
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/create-post')}
              title="إنشاء منشور"
            >
              <PlusSquare className="w-5 h-5 xl:w-6 xl:h-6" />
            </Button>
            <Notifications />
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-900 rounded-full"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="w-7 h-7 xl:w-8 xl:h-8">
                <AvatarImage src={userData.avatar} alt={userData.displayName} />
                <AvatarFallback>{userData.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
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
            <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-900" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => navigate('/create-post')}
            >
              <PlusSquare className="w-5 h-5" />
            </Button>
            <Notifications />
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-900 rounded-full"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="w-6 h-6 sm:w-7 sm:h-7">
                <AvatarImage src={userData.avatar} alt={userData.displayName} />
                <AvatarFallback>{userData.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-900"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden mt-3 py-2 border-t border-gray-800">
            <div className="grid grid-cols-4 gap-2">
              {navigationItems.map((item, index) => (
                <Button 
                  key={index}
                  variant="ghost" 
                  size="sm" 
                  className="flex flex-col items-center p-2 hover:bg-gray-900 text-xs"
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] text-gray-400">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
