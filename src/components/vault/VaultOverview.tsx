import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Users, Activity, DollarSign, Shield, Radio, AlertTriangle, TrendingUp
} from 'lucide-react';

interface VaultOverviewProps {
  stats: { users: number; posts: number; deposits: number; mods: number };
  maintenanceMode: boolean;
  onToggleMaintenance: () => void;
  lastSecurityLog?: string;
}

const VaultOverview = ({ stats, maintenanceMode, onToggleMaintenance, lastSecurityLog }: VaultOverviewProps) => {
  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.users, icon: Users, color: '#39FF14', glow: 'rgba(57,255,20,0.15)' },
    { label: 'المنشورات', value: stats.posts, icon: Activity, color: '#00D4FF', glow: 'rgba(0,212,255,0.15)' },
    { label: 'إيداعات معلقة', value: stats.deposits, icon: DollarSign, color: '#FFD700', glow: 'rgba(255,215,0,0.15)' },
    { label: 'المشرفون', value: stats.mods, icon: Shield, color: '#A855F7', glow: 'rgba(168,85,247,0.15)' },
  ];

  return (
    <div className="space-y-6">
      {/* Live Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-white/[0.03] border-white/[0.08] backdrop-blur-sm overflow-hidden relative group hover:border-white/20 transition-all">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 50% 50%, ${s.glow}, transparent 70%)` }} />
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-6 w-6" style={{ color: s.color }} />
                <TrendingUp className="h-3.5 w-3.5 text-gray-600" />
              </div>
              <p className="text-3xl font-bold text-white font-mono">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-sm">
          <CardContent className="p-5">
            <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4" /> حالة النظام
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{maintenanceMode ? 'وضع الصيانة مفعّل' : 'النظام يعمل بشكل طبيعي'}</p>
                <p className="text-xs text-gray-500 mt-1">التبديل يؤثر على جميع المستخدمين فوراً</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={onToggleMaintenance} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-sm">
          <CardContent className="p-5">
            <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> آخر تنبيه أمني
            </h3>
            <p className="text-white text-sm">
              {lastSecurityLog
                ? new Date(lastSecurityLog).toLocaleString('ar-IQ')
                : 'لا توجد تنبيهات أمنية ✅'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VaultOverview;
