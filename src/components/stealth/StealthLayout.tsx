import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity, Users, Shield, Video, Bell, Search, BadgeCheck,
  LogOut, RefreshCw, ChevronLeft, ChevronRight, LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Overview', path: '/system-panel', icon: LayoutDashboard },
  { title: 'Team', path: '/system-panel/team', icon: Shield },
  { title: 'Users', path: '/system-panel/users', icon: Users },
  { title: 'Content', path: '/system-panel/content', icon: Video },
  { title: 'Notifications', path: '/system-panel/notifications', icon: Bell },
  { title: 'Verification', path: '/system-panel/verification', icon: BadgeCheck },
];

interface Props {
  children: React.ReactNode;
  onRefresh?: () => void;
}

const StealthLayout = ({ children, onRefresh }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const verified = sessionStorage.getItem('stealth_verified');
      if (!verified) { navigate('/system-access'); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/system-access'); return; }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isStaff = roles?.some(r => r.role === 'admin' || r.role === 'moderator');
      if (!isStaff) { navigate('/'); return; }

      setAuthorized(true);
      setLoading(false);
    };
    check();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('stealth_verified');
    supabase.auth.signOut();
    navigate('/system-access');
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Activity className="h-6 w-6 text-[#00ff41] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex">
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,255,65,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 bg-[#0d0d0d] border-r border-[#1a1a1a] transition-all duration-200 flex flex-col ${collapsed ? 'w-14' : 'w-52'}`}>
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#1a1a1a]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#00ff41]" />
              <span className="font-mono text-xs text-[#00ff41] tracking-wider uppercase">System</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-600 hover:text-[#00ff41] transition p-1">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-2 py-2 rounded-md text-xs font-mono transition-colors ${
                  active
                    ? 'bg-[#00ff41]/10 text-[#00ff41]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title={item.title}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span className="tracking-wider uppercase">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#1a1a1a] p-2 space-y-1">
          {onRefresh && (
            <button onClick={onRefresh} className="flex items-center gap-3 px-2 py-2 w-full rounded-md text-xs font-mono text-gray-500 hover:text-[#00ff41] transition" title="Refresh">
              <RefreshCw className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="tracking-wider uppercase">Refresh</span>}
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-2 py-2 w-full rounded-md text-xs font-mono text-gray-500 hover:text-red-400 transition" title="Logout">
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="tracking-wider uppercase">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-200 ${collapsed ? 'ml-14' : 'ml-52'}`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default StealthLayout;
