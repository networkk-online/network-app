import { Home, PlusSquare, Film, User, Trophy, Compass, Clapperboard } from 'lucide-react';
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
    { icon: Clapperboard, label: 'سينما', path: '/network-tv' },
    { icon: Film, label: 'ريلز', path: '/shorts' },
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
          <div className="mx-4 mb-3 rounded-full border border-white/[0.08] bg-black/60 backdrop-blur-[30px]"
               style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-around px-3 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="flex flex-col items-center justify-center min-w-[48px] relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="navGlow"
                        className="absolute inset-0 rounded-full"
                        style={{ 
                          background: 'radial-gradient(circle, hsla(144, 90%, 33%, 0.12) 0%, transparent 70%)',
                          filter: 'blur(6px)'
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    )}
                    <Icon
                      className={`w-[22px] h-[22px] transition-all duration-200 ${
                        active ? 'text-primary' : 'text-white/40'
                      }`}
                      strokeWidth={active ? 2 : 1.4}
                      style={active ? { filter: 'drop-shadow(0 0 6px hsla(144, 90%, 33%, 0.5))' } : {}}
                    />
                  </motion.button>
                );
              })}

              {/* Profile Avatar */}
              <motion.button
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="flex flex-col items-center justify-center min-w-[48px] relative"
              >
                {isActive('/profile') && (
                  <motion.div
                    layoutId="navGlow"
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      background: 'radial-gradient(circle, hsla(144, 90%, 33%, 0.12) 0%, transparent 70%)',
                      filter: 'blur(6px)'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                {user ? (
                  <Avatar className={`w-6 h-6 ring-[1.5px] transition-all duration-200 ${
                    isActive('/profile') ? 'ring-primary' : 'ring-white/20'
                  }`}>
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-white/5"><User className="w-3 h-3 text-white/40" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <User className={`w-[22px] h-[22px] ${isActive('/profile') ? 'text-primary' : 'text-white/40'}`} strokeWidth={1.4} />
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
