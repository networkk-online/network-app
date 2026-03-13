import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Users, FileText, Video, MessageCircle, Trash2, Eye, RefreshCw } from 'lucide-react';

interface Props {
  currentUserId: string;
}

const AdminDataTab = ({ currentUserId }: Props) => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);

  useEffect(() => { loadData(activeSubTab); }, [activeSubTab]);

  const loadData = async (tab: string) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'users': {
          const { data } = await supabase.from('profiles').select('id, username, full_name, avatar_url, is_verified, verification_type, created_at, followers_count, following_count, bio, location').order('created_at', { ascending: false }).limit(200);
          if (data) setUsers(data);
          break;
        }
        case 'posts': {
          const { data } = await supabase.from('posts').select('id, content, media_url, likes_count, comments_count, shares_count, created_at, user_id').order('created_at', { ascending: false }).limit(200);
          if (data) {
            const userIds = [...new Set(data.map(p => p.user_id))];
            const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
            const enriched = data.map(p => ({ ...p, profile: profiles?.find(pr => pr.id === p.user_id) }));
            setPosts(enriched);
          }
          break;
        }
        case 'reels': {
          const { data } = await supabase.from('reels').select('id, caption, video_url, thumbnail_url, likes_count, comments_count, views_count, created_at, user_id').order('created_at', { ascending: false }).limit(200);
          if (data) {
            const userIds = [...new Set(data.map(r => r.user_id))];
            const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
            const enriched = data.map(r => ({ ...r, profile: profiles?.find(pr => pr.id === r.user_id) }));
            setReels(enriched);
          }
          break;
        }
        case 'comments': {
          const { data } = await supabase.from('comments').select('id, content, created_at, user_id, post_id').order('created_at', { ascending: false }).limit(200);
          if (data) {
            const userIds = [...new Set(data.map(c => c.user_id))];
            const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
            const enriched = data.map(c => ({ ...c, profile: profiles?.find(pr => pr.id === c.user_id) }));
            setComments(enriched);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const tableMap: Record<string, string> = { post: 'posts', reel: 'reels', comment: 'comments' };
      const table = tableMap[deleteTarget.type];
      if (!table) return;

      let error: any = null;
      if (deleteTarget.type === 'post') {
        const res = await supabase.from('posts').delete().eq('id', deleteTarget.id);
        error = res.error;
      } else if (deleteTarget.type === 'reel') {
        const res = await supabase.from('reels').delete().eq('id', deleteTarget.id);
        error = res.error;
      } else if (deleteTarget.type === 'comment') {
        const res = await supabase.from('comments').delete().eq('id', deleteTarget.id);
        error = res.error;
      }
      if (error) throw error;

      // Log the action
      await supabase.from('verification_logs').insert({
        admin_id: currentUserId,
        target_user_id: currentUserId,
        action: `deleted_${deleteTarget.type}`,
        notes: `Deleted ${deleteTarget.type}: ${deleteTarget.label}`,
        verification_type: null,
      });

      toast({ title: 'تم الحذف بنجاح' });
      loadData(activeSubTab);
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const filterData = (data: any[], fields: string[]) => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => fields.some(f => {
      const val = f.includes('.') ? f.split('.').reduce((o: any, k: string) => o?.[k], item) : item[f];
      return val?.toString().toLowerCase().includes(q);
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-[#111] border-border/30 text-white" />
        </div>
        <Button variant="ghost" size="sm" onClick={() => loadData(activeSubTab)}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-[#111] border border-border/20">
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />المستخدمين</TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5"><FileText className="h-3.5 w-3.5" />المنشورات</TabsTrigger>
          <TabsTrigger value="reels" className="gap-1.5"><Video className="h-3.5 w-3.5" />الريلز</TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" />التعليقات</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-[#111] border-border/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/20 text-muted-foreground">
                    <th className="text-right p-3">المستخدم</th>
                    <th className="text-right p-3 hidden md:table-cell">الموقع</th>
                    <th className="text-right p-3">المتابعين</th>
                    <th className="text-right p-3">المتابَعين</th>
                    <th className="text-right p-3 hidden md:table-cell">تاريخ الانضمام</th>
                  </tr></thead>
                  <tbody>
                    {filterData(users, ['username', 'full_name', 'location']).map(u => (
                      <tr key={u.id} className="border-b border-border/10 hover:bg-white/5">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div>
                              <p className="text-white text-xs font-medium">{u.full_name || 'بدون اسم'}</p>
                              <p className="text-muted-foreground text-[10px]">@{u.username || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-xs">{u.location || '—'}</td>
                        <td className="p-3 text-white text-xs">{u.followers_count || 0}</td>
                        <td className="p-3 text-white text-xs">{u.following_count || 0}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-[10px]">{new Date(u.created_at).toLocaleDateString('ar-IQ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card className="bg-[#111] border-border/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/20 text-muted-foreground">
                    <th className="text-right p-3">الناشر</th>
                    <th className="text-right p-3">المحتوى</th>
                    <th className="text-right p-3">❤️</th>
                    <th className="text-right p-3">💬</th>
                    <th className="text-right p-3 hidden md:table-cell">التاريخ</th>
                    <th className="text-right p-3">إجراء</th>
                  </tr></thead>
                  <tbody>
                    {filterData(posts, ['content', 'profile.username']).map(p => (
                      <tr key={p.id} className="border-b border-border/10 hover:bg-white/5">
                        <td className="p-3 text-white text-xs">@{p.profile?.username || '—'}</td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{p.content}</td>
                        <td className="p-3 text-white text-xs">{p.likes_count || 0}</td>
                        <td className="p-3 text-white text-xs">{p.comments_count || 0}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-[10px]">{new Date(p.created_at).toLocaleDateString('ar-IQ')}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: 'post', id: p.id, label: p.content?.slice(0, 30) })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reels">
          <Card className="bg-[#111] border-border/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/20 text-muted-foreground">
                    <th className="text-right p-3">الناشر</th>
                    <th className="text-right p-3">الوصف</th>
                    <th className="text-right p-3">👁️</th>
                    <th className="text-right p-3">❤️</th>
                    <th className="text-right p-3 hidden md:table-cell">التاريخ</th>
                    <th className="text-right p-3">إجراء</th>
                  </tr></thead>
                  <tbody>
                    {filterData(reels, ['caption', 'profile.username']).map(r => (
                      <tr key={r.id} className="border-b border-border/10 hover:bg-white/5">
                        <td className="p-3 text-white text-xs">@{r.profile?.username || '—'}</td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{r.caption || '—'}</td>
                        <td className="p-3 text-white text-xs">{r.views_count || 0}</td>
                        <td className="p-3 text-white text-xs">{r.likes_count || 0}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-[10px]">{new Date(r.created_at).toLocaleDateString('ar-IQ')}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: 'reel', id: r.id, label: r.caption?.slice(0, 30) || 'reel' })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="bg-[#111] border-border/20">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border/20 text-muted-foreground">
                    <th className="text-right p-3">المستخدم</th>
                    <th className="text-right p-3">التعليق</th>
                    <th className="text-right p-3 hidden md:table-cell">التاريخ</th>
                    <th className="text-right p-3">إجراء</th>
                  </tr></thead>
                  <tbody>
                    {filterData(comments, ['content', 'profile.username']).map(c => (
                      <tr key={c.id} className="border-b border-border/10 hover:bg-white/5">
                        <td className="p-3 text-white text-xs">@{c.profile?.username || '—'}</td>
                        <td className="p-3 text-muted-foreground text-xs max-w-[250px] truncate">{c.content}</td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground text-[10px]">{new Date(c.created_at).toLocaleDateString('ar-IQ')}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: 'comment', id: c.id, label: c.content?.slice(0, 30) })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {loading && <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1a1a1a] border-border/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">هل تريد حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border-border/30 text-white hover:bg-white/10">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDataTab;
