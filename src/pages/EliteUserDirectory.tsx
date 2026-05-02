import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  ArrowRight,
  MoreVertical,
  Eye,
  Gem,
  Ban,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NEON = '#19e05b';
const PAGE_SIZE = 10;

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_suspended: boolean;
  jewels: number;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const formatNum = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

const EliteUserDirectory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [presence, setPresence] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editValue, setEditValue] = useState('');

  // Auth check — admin/owner only
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');
      if (!roles || roles.length === 0) {
        toast({ title: 'غير مصرح', description: 'صفحة CEO فقط.', variant: 'destructive' });
        navigate('/');
        return;
      }
      setAuthorized(true);
      await loadUsers();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online presence via supabase realtime presence channel "online-users"
  useEffect(() => {
    const ch = supabase.channel('online-users', { config: { presence: { key: 'directory' } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ user_id?: string }>>;
      const ids = new Set<string>();
      Object.values(state).forEach((arr) => arr.forEach((p) => p.user_id && ids.add(p.user_id)));
      setPresence(ids);
    }).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at, is_suspended')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (!profiles) return;
    const ids = profiles.map((p) => p.id);
    const { data: gems } = await supabase
      .from('user_gems')
      .select('user_id, balance')
      .in('user_id', ids);

    const map = new Map((gems ?? []).map((g) => [g.user_id, Number(g.balance) || 0]));
    setUsers(
      profiles.map((p) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        is_suspended: p.is_suspended,
        jewels: map.get(p.id) ?? 0,
      }))
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const toggleSuspend = async (u: UserRow) => {
    const next = !u.is_suspended;
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: next })
      .eq('id', u.id);
    if (error) {
      toast({ title: 'فشل', description: error.message, variant: 'destructive' });
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_suspended: next } : x)));
    toast({ title: next ? 'تم الإيقاف' : 'تم التفعيل', description: u.full_name || u.username || '' });
  };

  const openEditJewels = (u: UserRow) => {
    setEditTarget(u);
    setEditValue(String(u.jewels));
  };

  const saveJewels = async () => {
    if (!editTarget) return;
    const n = parseInt(editValue, 10);
    if (isNaN(n) || n < 0) {
      toast({ title: 'قيمة غير صحيحة', variant: 'destructive' });
      return;
    }
    const { data: existing } = await supabase
      .from('user_gems')
      .select('id')
      .eq('user_id', editTarget.id)
      .maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from('user_gems').update({ balance: n }).eq('user_id', editTarget.id));
    } else {
      ({ error } = await supabase.from('user_gems').insert({ user_id: editTarget.id, balance: n }));
    }
    if (error) {
      toast({ title: 'فشل', description: error.message, variant: 'destructive' });
      return;
    }
    setUsers((prev) => prev.map((x) => (x.id === editTarget.id ? { ...x, jewels: n } : x)));
    toast({ title: 'تم تحديث الجواهر', description: `الرصيد الجديد: ${formatNum(n)} 💎` });
    setEditTarget(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/70">جاري التحميل...</div>
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-black/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="rounded-full text-[#19e05b] hover:bg-[#19e05b]/10 hover:shadow-[0_0_18px_#19e05b80]"
            aria-label="رجوع"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" style={{ color: NEON }} />
              CEO User Directory
            </h1>
            <p className="text-xs text-white/50">إدارة المستخدمين • Jewel Control • Account Status</p>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border bg-white/[0.04] backdrop-blur-xl"
            style={{ borderColor: `${NEON}66`, boxShadow: `0 0 22px ${NEON}40` }}
          >
            <Users className="h-4 w-4" style={{ color: NEON }} />
            <span className="text-sm font-semibold">{formatNum(users.length)}</span>
            <span className="text-xs text-white/60">Total Users</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، اليوزر، أو Networkk ID..."
            className="pr-10 bg-white/[0.04] border-white/10 backdrop-blur-xl text-white placeholder:text-white/40 focus-visible:ring-[#19e05b]/40 text-right"
            dir="rtl"
          />
        </div>

        {/* Table — Glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-white/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-right">User</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Networkk ID</th>
                  <th className="px-4 py-3 text-right">Jewels</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((u) => {
                  const online = presence.has(u.id);
                  return (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-1 ring-white/10">
                            <AvatarImage src={u.avatar_url || ''} alt="" />
                            <AvatarFallback className="bg-white/10 text-xs">
                              {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[180px]">
                              {u.full_name || u.username || 'بدون اسم'}
                            </div>
                            <div className="text-xs text-white/50 truncate max-w-[180px]">
                              @{u.username || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <code className="text-xs text-white/60 bg-black/40 px-2 py-1 rounded">
                          {u.id.slice(0, 8)}…
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Gem className="h-3.5 w-3.5" style={{ color: NEON }} />
                          {formatNum(u.jewels)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-white/60 text-xs">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_suspended ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                            <Ban className="h-3 w-3" /> Suspended
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border"
                            style={{
                              background: online ? `${NEON}1a` : 'transparent',
                              color: online ? NEON : 'rgba(255,255,255,0.5)',
                              borderColor: online ? `${NEON}66` : 'rgba(255,255,255,0.15)',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: online ? NEON : '#666',
                                boxShadow: online ? `0 0 8px ${NEON}` : 'none',
                              }}
                            />
                            {online ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-black/95 backdrop-blur-xl border-white/10 text-white"
                          >
                            <DropdownMenuItem onClick={() => navigate(`/profile/${u.id}`)}>
                              <Eye className="ml-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditJewels(u)}>
                              <Gem className="ml-2 h-4 w-4" style={{ color: NEON }} /> Edit Jewels
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              onClick={() => toggleSuspend(u)}
                              className="text-red-400 focus:text-red-300"
                            >
                              <Ban className="ml-2 h-4 w-4" />
                              {u.is_suspended ? 'Reactivate' : 'Ban / Suspend'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-white/50">
                      لا توجد نتائج.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-white/60">
            <div>
              عرض <span className="text-white">{(page - 1) * PAGE_SIZE + 1}</span>–
              <span className="text-white">{Math.min(page * PAGE_SIZE, filtered.length)}</span> من{' '}
              <span className="text-white">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 rounded bg-white/[0.05] text-white">
                {page} / {totalPages}
              </span>
              <Button
                size="icon"
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Jewels Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-black/95 backdrop-blur-2xl border border-white/10 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5" style={{ color: NEON }} />
              تعديل رصيد الجواهر
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-white/70">
              المستخدم: <span className="text-white font-medium">{editTarget?.full_name || editTarget?.username}</span>
            </p>
            <Input
              type="number"
              min={0}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-white/5 border-white/10 text-white text-right"
              dir="ltr"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="text-white/70">
              إلغاء
            </Button>
            <Button
              onClick={saveJewels}
              className="text-black font-semibold"
              style={{ background: NEON, boxShadow: `0 0 20px ${NEON}80` }}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EliteUserDirectory;
