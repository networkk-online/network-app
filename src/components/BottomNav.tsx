import { Home, PlusSquare, Film, User, Trophy, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldHideNav = location.pathname === '/messages';
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: Compass, label: 'استكشف', path: '/explore' },
    { icon: Film, label: 'ريلز', path: '/shorts' },
    { icon: Trophy, label: 'المشاهير', path: '/local-fame-rank' },
    { icon: PlusSquare, label: 'إنشاء', path: '/create-post' },
  ];

  return (
    <AnimatePresence>
      {!shouldHideNav && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        >
          <div className="mx-3 mb-2 glass-strong rounded-[2rem] border border-white/[0.08]">
            <div className="flex items-center justify-around px-2 py-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="flex flex-col items-center justify-center min-w-[52px] relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -top-1 w-6 h-1 rounded-full bg-primary"
                        style={{ boxShadow: '0 0 12px hsla(144, 90%, 33%, 0.6)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    )}
                    <Icon
                      className={`w-6 h-6 transition-all duration-200 ${
                        active ? 'text-primary nav-glow' : 'text-white/50'
                      }`}
                      strokeWidth={active ? 2.2 : 1.5}
                    />
                  </motion.button>
                );
              })}

              {/* Profile Avatar */}
              <motion.button
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="flex flex-col items-center justify-center min-w-[52px] relative"
              >
                {isActive('/profile') && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-1 w-6 h-1 rounded-full bg-primary"
                    style={{ boxShadow: '0 0 12px hsla(144, 90%, 33%, 0.6)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                {user ? (
                  <Avatar className={`w-6 h-6 ring-2 transition-all duration-200 ${
                    isActive('/profile') ? 'ring-primary' : 'ring-transparent'
                  }`}>
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <User className={`w-6 h-6 ${isActive('/profile') ? 'text-primary' : 'text-white/50'}`} strokeWidth={1.5} />
                )}
              </motion.button>
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
};

export default BottomNav;
