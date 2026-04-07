import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Shield, Gift, Settings, Eye, FileText,
  ChevronLeft, ChevronRight, Power, LogOut, UserCheck, Wallet, BarChart3,
  Film, Compass, Ban, BookOpen, Zap
} from 'lucide-react';

interface VaultSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  maintenanceMode: boolean;
  onLogout: () => void;
}

const menuGroups = [
  {
    title: 'القيادة',
    items: [
      { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
      { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
    ],
  },
  {
    title: 'المستخدمون',
    items: [
      { id: 'users', label: 'إدارة المستخدمين', icon: Users },
      { id: 'staff', label: 'إدارة المشرفين', icon: UserCheck },
      { id: 'verification', label: 'التحقق من الهوية', icon: Shield },
    ],
  },
  {
    title: 'المحتوى',
    items: [
      { id: 'explore', label: 'مدير الاستكشاف', icon: Compass },
      { id: 'reels', label: 'إدارة الريلز', icon: Film },
    ],
  },
  {
    title: 'المالية',
    items: [
      { id: 'finance', label: 'المالية والأصول', icon: Wallet },
      { id: 'gifts', label: 'أكواد الهدايا', icon: Gift },
    ],
  },
  {
    title: 'الأمان',
    items: [
      { id: 'security', label: 'تدقيق الأمان', icon: Eye },
      { id: 'ip-ban', label: 'حظر IP', icon: Ban },
      { id: 'logs', label: 'سجلات الوصول', icon: FileText },
    ],
  },
  {
    title: 'النظام',
    items: [
      { id: 'execution', label: 'مركز التنفيذ', icon: Zap },
      { id: 'docs', label: 'الوثائق', icon: BookOpen },
      { id: 'settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

const VaultSidebar = ({ activeTab, onTabChange, collapsed, onToggle, maintenanceMode, onLogout }: VaultSidebarProps) => {
  return (
    <aside className={cn(
      'fixed top-0 right-0 h-screen z-40 flex flex-col transition-all duration-300',
      'bg-black/90 backdrop-blur-2xl border-l border-[#39FF14]/10',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[#39FF14]/10 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#39FF14]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-[#39FF14] font-mono tracking-widest">G3142-AF26</h2>
            <p className="text-[9px] text-white/20 font-mono">MASTER CONTROL</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {!collapsed && (
              <p className="text-[9px] font-bold text-white/15 uppercase tracking-widest px-3 py-1.5">{group.title}</p>
            )}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all',
                  activeTab === item.id
                    ? 'bg-[#39FF14]/15 text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.08)] border border-[#39FF14]/20'
                    : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-[#39FF14]/10 space-y-1.5">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px]',
          maintenanceMode ? 'bg-red-500/10 text-red-400' : 'bg-[#39FF14]/5 text-[#39FF14]/60'
        )}>
          <Power className="w-3 h-3" />
          {!collapsed && <span>{maintenanceMode ? 'وضع الصيانة' : 'النظام متصل'}</span>}
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 text-[11px] transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && <span>خروج</span>}
        </button>
        <button onClick={onToggle} className="w-full flex items-center justify-center p-1.5 rounded-lg text-white/20 hover:bg-white/5 transition-colors">
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default VaultSidebar;
