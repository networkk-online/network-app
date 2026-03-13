import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, BadgeCheck, Building2, Landmark, Star, XCircle, Users } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  verification_type: string | null;
  created_at: string;
  followers_count: number | null;
  following_count: number | null;
}

interface Props {
  currentUserId: string;
}

const AdminVerificationTab = ({ currentUserId }: Props) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    username: string;
    type: 'business' | 'notable' | 'government' | null;
  } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, verification_type, created_at, followers_count, following_count')
      .order('created_at', { ascending: false })
      .limit(500);
    if (data) setUsers(data);
  };

  const handleVerification = async (userId: string, type: 'business' | 'notable' | 'government' | null) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: type !== null, verification_type: type })
        .eq('id', userId);
      if (error) throw error;

      await supabase.from('verification_logs').insert({
        admin_id: currentUserId,
        target_user_id: userId,
        action: type ? `verified_as_${type}` : 'removed_verification',
        verification_type: type,
      });

      toast({ title: 'تم بنجاح', description: type ? `تم التحقق كـ ${getTypeLabel(type)}` : 'تم إزالة التحقق' });
      loadUsers();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'business': return 'حساب تجاري';
      case 'notable': return 'شخصية بارزة';
      case 'government': return 'جهة حكومية';
      default: return 'غير موثّق';
    }
  };

  const getTypeBadge = (type: string | null, verified: boolean | null) => {
    if (!verified || !type) return <Badge variant="outline" className="text-muted-foreground">غير موثّق</Badge>;
    const styles: Record<string, string> = {
      business: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      notable: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      government: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return <Badge className={styles[type] || ''}>{getTypeLabel(type)}</Badge>;
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => u.username?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      if (filterType === 'verified') result = result.filter(u => u.is_verified);
      else if (filterType === 'unverified') result = result.filter(u => !u.is_verified);
      else result = result.filter(u => u.verification_type === filterType);
    }
    return result;
  }, [users, searchQuery, filterType]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="البحث باسم المستخدم..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-[#111] border-border/30 text-white" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 bg-[#111] border-border/30 text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-border/30">
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="verified">موثّقون</SelectItem>
            <SelectItem value="unverified">غير موثّقين</SelectItem>
            <SelectItem value="business">تجاري</SelectItem>
            <SelectItem value="notable">بارزة</SelectItem>
            <SelectItem value="government">حكومي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-[#111] border-border/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="text-right p-4">المستخدم</th>
                  <th className="text-right p-4 hidden md:table-cell">المتابعين</th>
                  <th className="text-right p-4 hidden md:table-cell">تاريخ الانضمام</th>
                  <th className="text-right p-4">الحالة</th>
                  <th className="text-right p-4">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/10 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.full_name || 'بدون اسم'}</p>
                          <p className="text-xs text-muted-foreground">@{user.username || 'unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{user.followers_count || 0}</td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">{new Date(user.created_at).toLocaleDateString('ar-IQ')}</td>
                    <td className="p-4">{getTypeBadge(user.verification_type, user.is_verified)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" disabled={actionLoading === user.id} onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'business' })} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 gap-1 text-xs px-2"><Building2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">تجاري</span></Button>
                        <Button size="sm" variant="ghost" disabled={actionLoading === user.id} onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'notable' })} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 text-xs px-2"><Star className="h-3.5 w-3.5" /><span className="hidden lg:inline">بارز</span></Button>
                        <Button size="sm" variant="ghost" disabled={actionLoading === user.id} onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: 'government' })} className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 gap-1 text-xs px-2"><Landmark className="h-3.5 w-3.5" /><span className="hidden lg:inline">حكومي</span></Button>
                        {user.is_verified && (
                          <Button size="sm" variant="ghost" disabled={actionLoading === user.id} onClick={() => setConfirmAction({ userId: user.id, username: user.username || 'unknown', type: null })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 text-xs px-2"><XCircle className="h-3.5 w-3.5" /><span className="hidden lg:inline">إزالة</span></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد نتائج</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-border/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.type ? 'تأكيد التحقق' : 'تأكيد إزالة التحقق'}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {confirmAction?.type
                ? `هل تريد توثيق حساب @${confirmAction?.username} كـ ${getTypeLabel(confirmAction?.type)}؟`
                : `هل تريد إزالة التحقق عن حساب @${confirmAction?.username}؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-border/30 text-white hover:bg-white/10">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmAction) { handleVerification(confirmAction.userId, confirmAction.type); setConfirmAction(null); } }}
              className={confirmAction?.type === 'business' ? 'bg-yellow-600 hover:bg-yellow-700' : confirmAction?.type === 'notable' ? 'bg-blue-600 hover:bg-blue-700' : confirmAction?.type === 'government' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}
            >تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVerificationTab;
