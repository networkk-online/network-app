import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import OwnerRouteGuard from '@/components/guards/OwnerRouteGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Users, Activity, DollarSign, Settings, Eye, Ban,
  Video, FileText, MessageSquare, Search, Power, LogOut,
  AlertTriangle, Clock, UserCheck, Lock, Gift, Plus, Copy, Check
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const OwnerVault = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [moderators, setModerators] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, posts: 0, deposits: 0, mods: 0 });

  useEffect(() => {
    fetchStats();
    fetchModerators();
    fetchSecurityLogs();
    fetchMaintenanceMode();
  }, []);

  const fetchStats = async () => {
    const [users, posts, deposits] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('deposits').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const { data: mods } = await supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'moderator');
    setStats({
      users: users.count || 0,
      posts: posts.count || 0,
      deposits: deposits.count || 0,
      mods: mods?.length || 0,
    });
  };

  const fetchModerators = async () => {
    const { data: modRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'moderator');
    if (!modRoles?.length) return;
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

  const updatePermission = async (userId: string, field: string, value: boolean) => {
    const { data: existing } = await supabase.from('moderator_permissions').select('id').eq('user_id', userId).single();
    if (existing) {
      await supabase.from('moderator_permissions').update({ [field]: value }).eq('user_id', userId);
    } else {
      await supabase.from('moderator_permissions').insert({ user_id: userId, [field]: value });
    }
    fetchModerators();
    toast({ title: 'تم تحديث الصلاحيات' });
  };

  const searchUsers = async () => {
    if (!searchUser.trim()) return;
    const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`).limit(10);
    setSearchResults(data || []);
  };

  const grantModeratorRole = async (uid: string) => {
    await supabase.from('user_roles').insert({ user_id: uid, role: 'moderator' });
    await supabase.from('moderator_permissions').insert({ user_id: uid });
    toast({ title: '✅ تم منح صلاحية المشرف' });
    fetchModerators();
    setSearchResults([]);
    setSearchUser('');
  };

  const revokeModeratorRole = async (uid: string) => {
    await supabase.from('user_roles').delete().eq('user_id', uid).eq('role', 'moderator');
    await supabase.from('moderator_permissions').delete().eq('user_id', uid);
    toast({ title: '🚫 تم سحب صلاحية المشرف', variant: 'destructive' });
    fetchModerators();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Gift codes state
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [coinAmount, setCoinAmount] = useState('1000');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadGiftCodes(); }, []);

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

  const permissionsList = [
    { key: 'can_ban_users', label: 'حظر المستخدمين', icon: Ban },
    { key: 'can_approve_videos', label: 'مراجعة الفيديوهات', icon: Video },
    { key: 'can_view_logs', label: 'عرض السجلات', icon: FileText },
    { key: 'can_delete_content', label: 'حذف المحتوى', icon: AlertTriangle },
    { key: 'can_view_reports', label: 'عرض البلاغات', icon: Eye },
    { key: 'can_manage_comments', label: 'إدارة التعليقات', icon: MessageSquare },
    { key: 'can_manage_gifts', label: 'إدارة الأكواد', icon: Gift },
  ];

  return (
    <OwnerRouteGuard>
      {({ userId }) => (
        <div className="min-h-screen bg-black text-gray-100">
          {/* Neon grid bg */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(57,255,20,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />

          {/* Header */}
          <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#39FF14]/20">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/30 p-2 rounded-xl">
                  <Lock className="h-5 w-5 text-[#39FF14]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#39FF14] font-mono tracking-wider">OWNER VAULT</h1>
                  <p className="text-xs text-gray-500 font-mono">CLASSIFIED ACCESS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMaintenance}
                  className={maintenanceMode ? 'text-red-400' : 'text-[#39FF14]'}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {maintenanceMode ? 'صيانة' : 'متصل'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 relative z-10">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'المستخدمين', value: stats.users, icon: Users, color: 'text-[#39FF14]' },
                { label: 'المنشورات', value: stats.posts, icon: Activity, color: 'text-cyan-400' },
                { label: 'إيداعات معلقة', value: stats.deposits, icon: DollarSign, color: 'text-yellow-400' },
                { label: 'المشرفين', value: stats.mods, icon: Shield, color: 'text-purple-400' },
              ].map((s) => (
                <Card key={s.label} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <s.icon className={`h-8 w-8 ${s.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-white">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                  <Activity className="h-4 w-4 mr-1" /> نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="staff" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                  <Shield className="h-4 w-4 mr-1" /> إدارة المشرفين
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                  <Eye className="h-4 w-4 mr-1" /> سجلات الأمان
                </TabsTrigger>
                <TabsTrigger value="gifts" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                  <Gift className="h-4 w-4 mr-1" /> الأكواد
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-[#39FF14]/20 data-[state=active]:text-[#39FF14]">
                  <Settings className="h-4 w-4 mr-1" /> الإعدادات
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#39FF14]">لوحة المالك - نظرة سريعة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-sm text-gray-400 mb-2">وضع الصيانة</h3>
                        <div className="flex items-center gap-3">
                          <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                          <span className={maintenanceMode ? 'text-red-400' : 'text-[#39FF14]'}>
                            {maintenanceMode ? '🔴 مفعّل' : '🟢 متاح'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h3 className="text-sm text-gray-400 mb-2">آخر محاولة وصول غير مصرح</h3>
                        <p className="text-xs text-gray-500">
                          {securityLogs[0]
                            ? new Date(securityLogs[0].created_at).toLocaleString('ar-IQ')
                            : 'لا توجد محاولات'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Management Tab */}
              <TabsContent value="staff">
                <div className="space-y-6">
                  {/* Add Moderator */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14] flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> إضافة مشرف جديد
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ابحث بالاسم أو اسم المستخدم..."
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                          onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                        />
                        <Button onClick={searchUsers} className="bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      {searchResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {searchResults.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                              <div>
                                <p className="text-white font-medium">{u.full_name || u.username}</p>
                                <p className="text-xs text-gray-400">@{u.username}</p>
                              </div>
                              <Button size="sm" onClick={() => grantModeratorRole(u.id)} className="bg-[#39FF14] text-black hover:bg-[#39FF14]/80">
                                منح صلاحية مشرف
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Moderators */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14]">المشرفون النشطون ({moderators.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {moderators.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا يوجد مشرفون حالياً</p>
                      ) : (
                        moderators.map((mod) => (
                          <div key={mod.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] font-bold">
                                  {(mod.full_name || mod.username || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{mod.full_name || mod.username}</p>
                                  <p className="text-xs text-gray-400">@{mod.username}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="destructive" onClick={() => revokeModeratorRole(mod.id)}>
                                سحب الصلاحية
                              </Button>
                            </div>

                            {/* Permissions Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {permissionsList.map((p) => (
                                <div key={p.key} className="flex items-center gap-2 p-2 rounded-lg bg-black/30">
                                  <Switch
                                    checked={mod.permissions?.[p.key] || false}
                                    onCheckedChange={(val) => updatePermission(mod.id, p.key, val)}
                                  />
                                  <p.icon className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-xs text-gray-300">{p.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Logs Tab */}
              <TabsContent value="security">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#39FF14] flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> سجلات الأمان
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {securityLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد سجلات أمان</p>
                      ) : (
                        securityLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-red-500/20">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <div>
                                <p className="text-sm text-white">{log.action_type}</p>
                                <p className="text-xs text-gray-400">
                                  المسار: {log.attempted_route} | المستخدم: {log.user_id?.slice(0, 8) || 'مجهول'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString('ar-IQ')}
                              </p>
                              <Badge variant="destructive" className="text-[10px]">غير مصرح</Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gift Codes Tab */}
              <TabsContent value="gifts">
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-[#39FF14] flex items-center gap-2">
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

                  <Card className="bg-white/5 border-white/10">
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
                            <TableRow key={gc.id} className="border-white/10">
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
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-[#39FF14]">إعدادات النظام</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">🔴 مفتاح الإيقاف الطارئ</h3>
                          <p className="text-xs text-gray-400 mt-1">إيقاف التطبيق بالكامل ووضعه في حالة الصيانة</p>
                        </div>
                        <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </OwnerRouteGuard>
  );
};

export default OwnerVault;
