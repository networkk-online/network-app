import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Shield, Gift, Settings, Eye, FileText,
  ChevronLeft, ChevronRight, Power, LogOut, UserCheck, Wallet, BarChart3
} from 'lucide-react';

interface VaultSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  maintenanceMode: boolean;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'users', label: 'إدارة المستخدمين', icon: Users },
  { id: 'staff', label: 'إدارة المشرفين', icon: UserCheck },
  { id: 'verification', label: 'طلبات التوثيق', icon: Shield },
  { id: 'finance', label: 'المالية والأصول', icon: Wallet },
  { id: 'gifts', label: 'أكواد الهدايا', icon: Gift },
  { id: 'security', label: 'سجلات الأمان', icon: Eye },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'logs', label: 'سجل العمليات', icon: FileText },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const VaultSidebar = ({ activeTab, onTabChange, collapsed, onToggle, maintenanceMode, onLogout }: VaultSidebarProps) => {
  return (
    <aside className={cn(
      'fixed top-0 right-0 h-screen z-40 flex flex-col transition-all duration-300',
      'bg-black/80 backdrop-blur-2xl border-l border-[#39FF14]/10',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-[#39FF14]/10 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#39FF14]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#39FF14] font-mono tracking-wider truncate">VAULT</h2>
            <p className="text-[10px] text-gray-600 font-mono">OWNER ACCESS</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
              activeTab === item.id
                ? 'bg-[#39FF14]/15 text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            )}
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[#39FF14]/10 space-y-2">
        {/* Maintenance indicator */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
          maintenanceMode ? 'bg-red-500/10 text-red-400' : 'bg-[#39FF14]/5 text-[#39FF14]'
        )}>
          <Power className="w-3.5 h-3.5" />
          {!collapsed && <span>{maintenanceMode ? 'وضع الصيانة' : 'النظام متصل'}</span>}
        </div>

        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>

        <button onClick={onToggle} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-white/5 transition-colors">
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default VaultSidebar;
