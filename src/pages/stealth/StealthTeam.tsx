import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2 } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { username: string | null; full_name: string | null };
}

const StealthTeam = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'admin' | 'moderator'>('moderator');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .in('role', ['admin', 'moderator'])
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const ids = data.map(d => d.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, full_name').in('id', ids);
      setStaff(data.map(s => ({ ...s, profile: profiles?.find(p => p.id === s.user_id) || undefined })));
    } else {
      setStaff([]);
    }
  };

  useEffect(() => { load(); }, []);

  const addMember = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('id').eq('username', username.trim()).maybeSingle();
      if (!profile) {
        toast({ title: 'User not found', variant: 'destructive' });
        return;
      }
      const { error } = await supabase.from('user_roles').insert([{ user_id: profile.id, role }]);
      if (error) {
        toast({ title: error.code === '23505' ? 'Role already assigned' : 'Error', variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff member added' });
      setUsername('');
      load();
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (id: string) => {
    await supabase.from('user_roles').delete().eq('id', id);
    toast({ title: 'Removed' });
    load();
  };

  return (
    <StealthLayout onRefresh={load}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">Team Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#111] border-[#1a1a1a] lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#00ff41]" /> Add Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm"
              dir="ltr"
            />
            <Select value={role} onValueChange={(v: 'admin' | 'moderator') => setRole(v)}>
              <SelectTrigger className="bg-[#0a0a0a] border-[#222] text-gray-200 font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111] border-[#222]">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addMember} disabled={loading} className="w-full bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/20 font-mono text-xs uppercase">
              Add
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#1a1a1a] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider">Current Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                  <TableHead className="font-mono text-xs text-gray-500">User</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Role</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Since</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500 w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(m => (
                  <TableRow key={m.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                    <TableCell className="font-mono text-xs text-gray-300">
                      {m.profile?.full_name || m.profile?.username || m.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] ${m.role === 'admin' ? 'border-[#00ff41]/40 text-[#00ff41]' : 'border-blue-500/40 text-blue-400'}`}>
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {new Date(m.created_at || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => removeMember(m.id)} className="text-gray-600 hover:text-red-400 transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {staff.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center font-mono text-xs text-gray-600 py-8">No staff members</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </StealthLayout>
  );
};

export default StealthTeam;
