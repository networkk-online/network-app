import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Search, UserCheck, Ban, Video, FileText, AlertTriangle, Eye, MessageSquare, Gift, UserMinus } from 'lucide-react';

interface Moderator {
  id: string;
  username: string;
  full_name: string;
  permissions: any;
}

interface VaultStaffManagerProps {
  moderators: Moderator[];
  onRefresh: () => void;
}

const permissionsList = [
  { key: 'can_ban_users', label: 'حظر المستخدمين', icon: Ban, desc: 'يمكنه حظر/رفع الحظر' },
  { key: 'can_approve_videos', label: 'مراجعة الفيديوهات', icon: Video, desc: 'مراجعة وحذف المحتوى المرئي' },
  { key: 'can_view_logs', label: 'عرض السجلات', icon: FileText, desc: 'الاطلاع على سجلات النظام' },
  { key: 'can_delete_content', label: 'حذف المحتوى', icon: AlertTriangle, desc: 'حذف منشورات/ريلز/تعليقات' },
  { key: 'can_view_reports', label: 'عرض البلاغات', icon: Eye, desc: 'مراجعة بلاغات المستخدمين' },
  { key: 'can_manage_comments', label: 'إدارة التعليقات', icon: MessageSquare, desc: 'تعديل/حذف التعليقات' },
  { key: 'can_manage_gifts', label: 'إدارة الأكواد', icon: Gift, desc: 'عرض أكواد الهدايا (قراءة فقط)' },
];

const VaultStaffManager = ({ moderators, onRefresh }: VaultStaffManagerProps) => {
  const { toast } = useToast();
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchUsers = async () => {
    if (!searchUser.trim()) return;
    const { data } = await supabase.from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const grantModeratorRole = async (uid: string) => {
    await supabase.from('user_roles').insert({ user_id: uid, role: 'moderator' });
    await supabase.from('moderator_permissions').insert({ user_id: uid });
    toast({ title: '✅ تم منح صلاحية المشرف' });
    onRefresh();
    setSearchResults([]);
    setSearchUser('');
  };

  const revokeModeratorRole = async (uid: string) => {
    await supabase.from('user_roles').delete().eq('user_id', uid).eq('role', 'moderator');
    await supabase.from('moderator_permissions').delete().eq('user_id', uid);
    toast({ title: '🚫 تم سحب صلاحية المشرف', variant: 'destructive' });
    onRefresh();
  };

  const updatePermission = async (userId: string, field: string, value: boolean) => {
    const { data: existing } = await supabase.from('moderator_permissions').select('id').eq('user_id', userId).single();
    if (existing) {
      await supabase.from('moderator_permissions').update({ [field]: value }).eq('user_id', userId);
    } else {
      await supabase.from('moderator_permissions').insert({ user_id: userId, [field]: value });
    }
    onRefresh();
    toast({ title: 'تم تحديث الصلاحيات' });
  };

  return (
    <div className="space-y-6">
      {/* Add Moderator */}
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#39FF14] flex items-center gap-2 text-base">
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
                    <p className="text-white font-medium text-sm">{u.full_name || u.username}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                  <Button size="sm" onClick={() => grantModeratorRole(u.id)} className="bg-[#39FF14] text-black hover:bg-[#39FF14]/80 text-xs">
                    منح صلاحية
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Moderators with Permissions Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm text-gray-400 font-medium">المشرفون النشطون ({moderators.length})</h3>
        {moderators.length === 0 ? (
          <Card className="bg-white/[0.03] border-white/[0.08]">
            <CardContent className="py-12 text-center text-gray-500">لا يوجد مشرفون حالياً</CardContent>
          </Card>
        ) : (
          moderators.map((mod) => (
            <Card key={mod.id} className="bg-white/[0.03] border-white/[0.08] overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] font-bold text-sm">
                      {(mod.full_name || mod.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{mod.full_name || mod.username}</p>
                      <p className="text-xs text-gray-500">@{mod.username}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revokeModeratorRole(mod.id)} className="text-red-400 hover:bg-red-500/10 gap-1">
                    <UserMinus className="h-3.5 w-3.5" /> سحب
                  </Button>
                </div>

                {/* Permissions Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissionsList.map((p) => (
                    <div key={p.key} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <p.icon className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-300">{p.label}</p>
                          <p className="text-[10px] text-gray-600">{p.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={mod.permissions?.[p.key] || false}
                        onCheckedChange={(val) => updatePermission(mod.id, p.key, val)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VaultStaffManager;
