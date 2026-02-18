import { useEffect, useState } from 'react';
import StealthLayout from '@/components/stealth/StealthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Video, Trash2, EyeOff, Pin } from 'lucide-react';

interface ReelRow {
  id: string;
  caption: string | null;
  video_url: string;
  views_count: number | null;
  likes_count: number | null;
  created_at: string;
  user_id: string;
  show_in_feed: boolean | null;
  profile?: { username: string | null };
}

const StealthContent = () => {
  const { toast } = useToast();
  const [reels, setReels] = useState<ReelRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reels')
      .select('id, caption, video_url, views_count, likes_count, created_at, user_id, show_in_feed')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const ids = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ids);
      setReels(data.map(r => ({ ...r, profile: profiles?.find(p => p.id === r.user_id) })));
    } else {
      setReels([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteReel = async (id: string) => {
    const { error } = await supabase.from('reels').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', variant: 'destructive' });
      return;
    }
    toast({ title: 'Content deleted' });
    load();
  };

  const toggleVisibility = async (id: string, current: boolean | null) => {
    await supabase.from('reels').update({ show_in_feed: !current }).eq('id', id);
    toast({ title: current ? 'Hidden from feed' : 'Visible in feed' });
    load();
  };

  return (
    <StealthLayout onRefresh={load}>
      <h1 className="text-lg font-mono text-[#00ff41] uppercase tracking-wider mb-6">Content Manager</h1>

      <Card className="bg-[#111] border-[#1a1a1a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Video className="h-4 w-4 text-[#00ff41]" /> Reels / Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                  <TableHead className="font-mono text-xs text-gray-500">User</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Caption</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Views</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Likes</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Date</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500">Status</TableHead>
                  <TableHead className="font-mono text-xs text-gray-500 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reels.map(r => (
                  <TableRow key={r.id} className="border-[#1a1a1a] hover:bg-[#151515]">
                    <TableCell className="font-mono text-xs text-gray-300">{r.profile?.username || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-300 max-w-[200px] truncate">{r.caption || '—'}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{r.views_count || 0}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{r.likes_count || 0}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] ${r.show_in_feed !== false ? 'border-[#00ff41]/40 text-[#00ff41]' : 'border-red-500/40 text-red-400'}`}>
                        {r.show_in_feed !== false ? 'Visible' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleVisibility(r.id, r.show_in_feed)} className="text-gray-600 hover:text-yellow-400 transition p-1" title="Toggle visibility">
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteReel(r.id)} className="text-gray-600 hover:text-red-400 transition p-1" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {reels.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={7} className="text-center font-mono text-xs text-gray-600 py-8">No content</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </StealthLayout>
  );
};

export default StealthContent;
