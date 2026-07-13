import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import OwnerRouteGuard from '@/components/guards/OwnerRouteGuard';
import VaultSidebar from '@/components/vault/VaultSidebar';
import VaultOverview from '@/components/vault/VaultOverview';
import VaultUserDirectory from '@/components/vault/VaultUserDirectory';
import VaultStaffManager from '@/components/vault/VaultStaffManager';
import VerificationRequests from '@/pages/VerificationRequests';
import VaultSecurityAudit from '@/components/vault/VaultSecurityAudit';
import VaultAnalytics from '@/components/vault/VaultAnalytics';
import VaultExecution from '@/components/vault/VaultExecution';
import VaultDocs from '@/components/vault/VaultDocs';
import VaultFinance from '@/components/vault/VaultFinance';
import { VaultLiveMonitor } from '@/components/vault/VaultLiveMonitor';
import VaultIntelligence from '@/components/vault/VaultIntelligence';
import VaultBroadcast from '@/components/vault/VaultBroadcast';
import MasterGiftCodes from '@/components/master-admin/MasterGiftCodes';
import MasterExploreControl from '@/components/master-admin/MasterExploreControl';
import MasterReelsManager from '@/components/master-admin/MasterReelsManager';
import VaultPagesContent from '@/components/vault/VaultPagesContent';
import VaultCareersManager from '@/components/vault/VaultCareersManager';
import VaultSupportCenter from '@/components/vault/VaultSupportCenter';
import VaultPaymentGateways from '@/components/vault/VaultPaymentGateways';
import VaultSeoManager from '@/components/vault/VaultSeoManager';
import VaultMatchesManager from '@/components/vault/VaultMatchesManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const OwnerVault = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moderators, setModerators] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [liveIndicators, setLiveIndicators] = useState(true);
  const [stats, setStats] = useState({ users: 0, posts: 0, deposits: 0, mods: 0 });

  useEffect(() => {
    fetchStats();
    fetchModerators();
    fetchSecurityLogs();
    fetchMaintenanceMode();
    fetchLiveIndicators();
  }, []);

  const fetchLiveIndicators = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'live_indicators_enabled').maybeSingle();
    setLiveIndicators((data?.value as any)?.enabled !== false);
  };

  const toggleLiveIndicators = async () => {
    const newVal = !liveIndicators;
    await supabase.from('app_settings').upsert({
      key: 'live_indicators_enabled',
      value: { enabled: newVal },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    setLiveIndicators(newVal);
    toast({ title: newVal ? '🟢 مؤشرات البث المباشر مُفعّلة' : '⚪ تم إيقاف مؤشرات البث' });
  };

  const fetchStats = async () => {
    const [users, posts, deposits] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const { data: mods } = await supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'moderator');
    setStats({ users: users.count || 0, posts: posts.count || 0, deposits: deposits.count || 0, mods: mods?.length || 0 });
  };

  const fetchModerators = async () => {
    const { data: modRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'moderator');
    if (!modRoles?.length) { setModerators([]); return; }
    const ids = modRoles.map(r => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', ids);
    const modsWithPerms = await Promise.all((profiles || []).map(async (p) => {
      const { data: perms } = await supabase.from('moderator_permissions').select('*').eq('user_id', p.id).single();
      return { ...p, permissions: perms };
    }));
    setModerators(modsWithPerms);
  };

  const fetchSecurityLogs = async () => {
    const { data } = await supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setSecurityLogs(data || []);
  };

  const fetchMaintenanceMode = async () => {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'maintenance_mode').single();
    if (data) setMaintenanceMode((data.value as any)?.enabled || false);
  };

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    await supabase.from('app_settings').update({
      value: { enabled: newVal, message: 'التطبيق تحت الصيانة' },
      updated_at: new Date().toISOString(),
    }).eq('key', 'maintenance_mode');
    setMaintenanceMode(newVal);
    toast({ title: newVal ? '🔴 وضع الصيانة مفعّل' : '🟢 التطبيق متاح الآن' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabTitles: Record<string, string> = {
    overview: 'نظرة عامة',
    intelligence: 'مركز الاستخبارات',
    users: 'إدارة المستخدمين',
    staff: 'إدارة المشرفين',
    verification: 'التحقق من الهوية',
    explore: 'مدير الاستكشاف',
    reels: 'إدارة الريلز',
    matches: 'المباريات المباشرة',
    finance: 'المالية والأصول',
    'payment-gateways': 'بوابات الدفع',
    gifts: 'أكواد الهدايا',
    security: 'تدقيق الأمان',
    'ip-ban': 'حظر IP',
    logs: 'سجلات الوصول',
    analytics: 'التحليلات',
    broadcast: 'بث إشعار للجميع',
    execution: 'مركز التنفيذ',
    'pages-content': 'محتوى الصفحات',
    careers: 'إدارة الوظائف',
    'support-center': 'مركز الدعم',
    seo: 'SEO والكلمات المفتاحية',
    docs: 'الوثائق',
    settings: 'الإعدادات',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <VaultOverview stats={stats} maintenanceMode={maintenanceMode} onToggleMaintenance={toggleMaintenance} lastSecurityLog={securityLogs[0]?.created_at} />;
      case 'intelligence':
        return <VaultIntelligence />;
      case 'users':
        return <VaultUserDirectory />;
      case 'staff':
        return <VaultStaffManager moderators={moderators} onRefresh={fetchModerators} />;
      case 'verification':
        return <VaultVerification />;
      case 'explore':
        return <MasterExploreControl />;
      case 'reels':
        return <MasterReelsManager />;
      case 'live':
        return <VaultLiveMonitor />;
      case 'matches':
        return <VaultMatchesManager />;
      case 'finance':
        return <VaultFinance />;
      case 'payment-gateways':
        return <VaultPaymentGateways />;
      case 'pages-content':
        return <VaultPagesContent />;
      case 'careers':
        return <VaultCareersManager />;
      case 'support-center':
        return <VaultSupportCenter />;
      case 'seo':
        return <VaultSeoManager />;
      case 'gifts':
        return <MasterGiftCodes />;
      case 'security':
      case 'ip-ban':
      case 'logs':
        return <VaultSecurityAudit />;
      case 'analytics':
        return <VaultAnalytics />;
      case 'broadcast':
        return <VaultBroadcast />;
      case 'execution':
        return <VaultExecution />;
      case 'docs':
        return <VaultDocs />;
      case 'settings':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-[#39FF14] text-base">إعدادات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">🔴 مفتاح الإيقاف الطارئ</h3>
                    <p className="text-xs text-white/30 mt-1">إيقاف التطبيق ووضعه في حالة الصيانة</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">🟢 مؤشرات البث المباشر</h3>
                    <p className="text-xs text-white/30 mt-1">إظهار حلقة LIVE النيون حول صور المستخدمين المباشرين</p>
                  </div>
                  <Switch checked={liveIndicators} onCheckedChange={toggleLiveIndicators} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardContent className="py-16 text-center">
              <p className="text-white/30">قسم "{activeTab}" قيد التطوير</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <OwnerRouteGuard>
      {({ userId }) => (
        <div className="min-h-screen bg-black text-white/90">
          {/* Background grid */}
          <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          {/* Sidebar */}
          <VaultSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            maintenanceMode={maintenanceMode}
            onLogout={handleLogout}
          />

          {/* Main Content */}
          <main className={cn('transition-all duration-300 min-h-screen relative z-10', sidebarCollapsed ? 'mr-16' : 'mr-64')}>
            {/* Header */}
            <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.04] px-6 py-3 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-white">{tabTitles[activeTab] || activeTab}</h1>
                <p className="text-[9px] text-white/15 font-mono tracking-widest mt-0.5">G3142-AF26-0x99 • MASTER CONTROL</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-[#39FF14]'}`} />
                <span className="text-[10px] text-white/20 font-mono">System ID: G3142-AF26-0x99</span>
              </div>
            </header>

            <div className="p-6">{renderContent()}</div>
          </main>
        </div>
      )}
    </OwnerRouteGuard>
  );
};

export default OwnerVault;
