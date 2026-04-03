import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import OwnerRouteGuard from '@/components/guards/OwnerRouteGuard';
import VaultSidebar from '@/components/vault/VaultSidebar';
import VaultOverview from '@/components/vault/VaultOverview';
import VaultUserDirectory from '@/components/vault/VaultUserDirectory';
import VaultStaffManager from '@/components/vault/VaultStaffManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Gift, Plus, Copy, Check, AlertTriangle, Power, Eye, Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const OwnerVault = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moderators, setModerators] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [stats, setStats] = useState({ users: 0, posts: 0, deposits: 0, mods: 0 });

  // Gift codes
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [coinAmount, setCoinAmount] = useState('1000');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchModerators();
    fetchSecurityLogs();
    fetchMaintenanceMode();
    loadGiftCodes();
  }, []);

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

  const loadGiftCodes = async () => {
    const { data } = await supabase.from('gift_codes').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setGiftCodes(data);
  };

  const generateGiftCode = async () => {
    setIsGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));
    await supabase.from('gift_codes').insert({
      code, coin_amount: parseInt(coinAmount), created_by: user.id, expires_at: expiresAt.toISOString(),
    });
    toast({ title: '✅ تم إنشاء الكود', description: code });
    loadGiftCodes();
    setIsGenerating(false);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <VaultOverview
            stats={stats}
            maintenanceMode={maintenanceMode}
            onToggleMaintenance={toggleMaintenance}
            lastSecurityLog={securityLogs[0]?.created_at}
          />
        );

      case 'users':
        return <VaultUserDirectory />;

      case 'staff':
        return <VaultStaffManager moderators={moderators} onRefresh={fetchModerators} />;

      case 'security':
        return (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardHeader>
              <CardTitle className="text-[#39FF14] flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5" /> سجلات الأمان ({securityLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">لا توجد سجلات أمان ✅</p>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-red-500/10 hover:border-red-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                        <div>
                          <p className="text-sm text-white">{log.action_type}</p>
                          <p className="text-xs text-gray-500">
                            المسار: {log.attempted_route} | {log.user_id?.slice(0, 8) || 'مجهول'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 shrink-0">
                        {new Date(log.created_at).toLocaleString('ar-IQ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'gifts':
        return (
          <div className="space-y-6">
            <Card className="bg-white/[0.03] border-white/[0.08]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[#39FF14] flex items-center gap-2 text-base">
                  <Gift className="h-5 w-5" /> إنشاء كود جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">عدد العملات</label>
                    <Select value={coinAmount} onValueChange={setCoinAmount}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[100, 500, 1000, 5000, 10000].map(a => (
                          <SelectItem key={a} value={a.toString()}>{a.toLocaleString()} 💎</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">صلاحية (أيام)</label>
                    <Input type="number" value={expirationDays} onChange={(e) => setExpirationDays(e.target.value)}
                      className="bg-white/5 border-white/10 text-white" min={1} max={365} />
                  </div>
                </div>
                <Button onClick={generateGiftCode} disabled={isGenerating}
                  className="w-full bg-[#39FF14] text-black font-bold hover:bg-[#39FF14]/80">
                  <Plus className="w-4 h-4 mr-2" />
                  {isGenerating ? 'جاري الإنشاء...' : 'إنشاء كود'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border-white/[0.08]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-right text-gray-400">الكود</TableHead>
                      <TableHead className="text-right text-gray-400">العملات</TableHead>
                      <TableHead className="text-right text-gray-400">الحالة</TableHead>
                      <TableHead className="text-right text-gray-400">انتهاء</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCodes.map((gc) => (
                      <TableRow key={gc.id} className="border-white/5">
                        <TableCell className="font-mono text-sm font-bold text-[#39FF14]">{gc.code}</TableCell>
                        <TableCell className="text-white">{gc.coin_amount.toLocaleString()} 💎</TableCell>
                        <TableCell>
                          <Badge className={gc.status === 'active'
                            ? 'bg-[#39FF14]/20 text-[#39FF14] border-[#39FF14]/30'
                            : 'bg-white/10 text-gray-400'}>
                            {gc.status === 'active' ? 'نشط' : 'مُستخدم'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {gc.expires_at ? new Date(gc.expires_at).toLocaleDateString('ar-IQ') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => copyCode(gc.code, gc.id)}>
                            {copiedId === gc.id ? <Check className="w-4 h-4 text-[#39FF14]" /> : <Copy className="w-4 h-4 text-gray-400" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {giftCodes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">لا توجد أكواد</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

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
                    <p className="text-xs text-gray-500 mt-1">إيقاف التطبيق ووضعه في حالة الصيانة</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardContent className="py-16 text-center">
              <p className="text-gray-500">قسم "{activeTab}" قيد التطوير</p>
            </CardContent>
          </Card>
        );
    }
  };

  const tabTitles: Record<string, string> = {
    overview: 'نظرة عامة',
    users: 'إدارة المستخدمين',
    staff: 'إدارة المشرفين',
    verification: 'طلبات التوثيق',
    finance: 'المالية والأصول',
    gifts: 'أكواد الهدايا',
    security: 'سجلات الأمان',
    analytics: 'التحليلات',
    logs: 'سجل العمليات',
    settings: 'الإعدادات',
  };

  return (
    <OwnerRouteGuard>
      {({ userId }) => (
        <div className="min-h-screen bg-black text-gray-100">
          {/* Background */}
          <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
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
          <main className={cn(
            'transition-all duration-300 min-h-screen relative z-10',
            sidebarCollapsed ? 'mr-16' : 'mr-64'
          )}>
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
              <h1 className="text-lg font-bold text-white">{tabTitles[activeTab] || activeTab}</h1>
            </header>

            <div className="p-6">
              {renderContent()}
            </div>
          </main>
        </div>
      )}
    </OwnerRouteGuard>
  );
};

export default OwnerVault;
