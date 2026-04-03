import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Ban, KeyRound, Bell, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VaultUserDirectory = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = async () => {
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    if (search.trim()) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }
    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setUsers(data || []);
    setTotal(count || 0);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const updateVerification = async (userId: string, type: string | null) => {
    await supabase.from('profiles').update({
      is_verified: !!type,
      verification_type: type,
    }).eq('id', userId);
    toast({ title: '✅ تم تحديث التوثيق' });
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="بحث بالاسم، المستخدم، أو الهاتف..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-white/5 border-white/10 text-white pr-10"
          />
        </div>
        <Badge variant="outline" className="text-[#39FF14] border-[#39FF14]/30 shrink-0">
          <Users className="h-3 w-3 mr-1" /> {total}
        </Badge>
      </div>

      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-right text-gray-400">المستخدم</TableHead>
                <TableHead className="text-right text-gray-400">الهاتف</TableHead>
                <TableHead className="text-right text-gray-400">التوثيق</TableHead>
                <TableHead className="text-right text-gray-400">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#39FF14]">
                        {(u.full_name || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{u.full_name || '-'}</p>
                        <p className="text-xs text-gray-500">@{u.username || 'N/A'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm font-mono">
                    {u.phone_number || '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.verification_type || 'none'}
                      onValueChange={(val) => updateVerification(u.id, val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون</SelectItem>
                        <SelectItem value="gold">🟡 ذهبي</SelectItem>
                        <SelectItem value="blue">🔵 أزرق</SelectItem>
                        <SelectItem value="gray">⚪ رمادي</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-red-400" title="حظر">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-yellow-400" title="إعادة تعيين كلمة المرور">
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-cyan-400" title="إشعار">
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">لا يوجد مستخدمون</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} من {total}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-gray-400">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)} className="text-gray-400">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultUserDirectory;
