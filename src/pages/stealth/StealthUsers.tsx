import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  phone_number: string | null;
  is_verified: boolean | null;
  created_at: string;
  followers_count: number | null;
}

const StealthUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = async () => {
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, phone_number, is_verified, created_at, followers_count', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }

    const { data, count } = await query;
    setUsers(data || []);
    setTotal(count || 0);
  };

  useEffect(() => { load(); }, [page, search]);

  return (
    <StealthLayout onRefresh={load}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">User Database</h1>

      <Card className="bg-[#111] border-[#1a1a1a]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-[#00ff41]" /> {total.toLocaleString()} registered
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-600" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search users..."
                className="pl-8 bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-xs h-9"
                dir="ltr"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                  <TableHead className="font-mono text-xs text-gray-500">Username</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Name</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Phone</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Joined</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Followers</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                    <TableCell className="font-mono text-xs text-gray-300">{u.username || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-300">{u.full_name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400" dir="ltr">{u.phone_number || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{u.followers_count || 0}</TableCell>
                    <TableCell>
                      {u.is_verified && (
                        <Badge variant="outline" className="font-mono text-[10px] border-[#00ff41]/40 text-[#00ff41]">Verified</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center font-mono text-xs text-gray-600 py-8">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {total > PAGE_SIZE && (
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="font-mono text-xs text-gray-500 hover:text-[#00ff41] disabled:opacity-30">← Prev</button>
              <span className="font-mono text-xs text-gray-600">{page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total} className="font-mono text-xs text-gray-500 hover:text-[#00ff41] disabled:opacity-30">Next →</button>
            </div>
          )}
        </CardContent>
      </Card>
    </StealthLayout>
  );
};

export default StealthUsers;
