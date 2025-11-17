import { Home, PlusSquare, Search, Film, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
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

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Film, label: 'الريلز', path: '/shorts' },
    { icon: PlusSquare, label: 'إنشاء', path: '/create-post' },
    { icon: Search, label: 'بحث', path: '/search' },
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
              className="flex flex-col items-center justify-center min-w-[60px] group"
            >
              <Icon 
                className={`w-7 h-7 transition-colors ${
                  active 
                    ? 'text-primary' 
                    : 'text-white group-hover:text-primary'
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
            </button>
          );
        })}
        
        {/* Profile Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center justify-center min-w-[60px] group"
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
