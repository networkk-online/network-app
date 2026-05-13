import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Gift, Film, Compass, Settings, LogOut, Menu, ChevronRight } from 'lucide-react';
import MasterOverview from '@/components/master-admin/MasterOverview';
import MasterGiftCodes from '@/components/master-admin/MasterGiftCodes';
import MasterReelsManager from '@/components/master-admin/MasterReelsManager';
import MasterExploreControl from '@/components/master-admin/MasterExploreControl';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'gifts', label: 'أكواد الهدايا', icon: Gift },
  { id: 'reels', label: 'إدارة الريلز', icon: Film },
  { id: 'explore', label: 'تحكم الاستكشاف', icon: Compass },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const MasterAdmin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Server-side validation: must be signed in AND have admin role.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) navigate('/login'); return; }
      const { data: role } = await supabase.from('user_roles')
        .select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (cancelled) return;
      if (role) setIsAuthenticated(true);
      else navigate('/');
      setChecking(false);
    })();
    // Clear any legacy client-only flag
    sessionStorage.removeItem('master_admin_auth');
    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };


  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#39FF14] text-xs font-mono tracking-widest">VERIFYING ACCESS…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[#39FF14] mx-auto mb-3" />
          <p className="text-white/60 text-sm">Access denied. Admin role required.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <MasterOverview />;
      case 'gifts': return <MasterGiftCodes />;
      case 'reels': return <MasterReelsManager />;
      case 'explore': return <MasterExploreControl />;
      case 'settings':
        return (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h2 className="text-[#39FF14] font-bold mb-4">إعدادات النظام</h2>
            <p className="text-white/40 text-sm">قريباً...</p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 right-0 h-full z-40 transition-all duration-300 border-l border-white/[0.06]',
        'bg-black/90 backdrop-blur-2xl',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        <div className="p-4 flex items-center justify-between border-b border-white/[0.06]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#39FF14]" />
              <span className="text-sm font-bold text-[#39FF14]">MASTER</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40">
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-2 space-y-1 mt-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  active
                    ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{tab.label}</span>}
                {sidebarOpen && active && <ChevronRight className="w-3 h-3 mr-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={cn('transition-all duration-300 min-h-screen relative z-10', sidebarOpen ? 'mr-60' : 'mr-16')}>
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <span className="text-[10px] text-white/20 tracking-widest">networkk.online</span>
        </header>
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default MasterAdmin;
