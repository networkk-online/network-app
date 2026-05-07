import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, ShieldCheck, Ban, Trash2, Bell, Eye, Search, Activity,
  LayoutDashboard, BadgeCheck, FileWarning, ScrollText, Gem,
  Settings, LogOut, ChevronDown, Loader2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NEON = '#19e05b';

interface UserRow {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  is_suspended: boolean;
  verification_type: string | null;
  phone_number?: string | null;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, route: '/master-control' },
  { id: 'users', label: 'User Management', icon: Users, route: '/master-control' },
  { id: 'verify', label: 'Verification', icon: BadgeCheck, route: '/admin/verification' },
  { id: 'content', label: 'Content Moderation', icon: FileWarning, route: '/admin/content' },
  { id: 'logs', label: 'System Logs & Security', icon: ScrollText, route: '/admin/logs' },
  { id: 'gems', label: 'Monetization (Gems)', icon: Gem, route: '/admin/gift-codes' },
  { id: 'settings', label: 'Settings', icon: Settings, route: '/admin/settings' },
];

const PAGE_SIZE = 10;

export default function MasterControlDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [onlineCount, setOnlineCount] = useState(0);
  const [section, setSection] = useState('users');

  // Auth gate
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isAdmin = roles?.some(r => r.role === 'admin');
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      const isOwner = profile?.username === '11556zzaa';
      if (!isAdmin && !isOwner) { navigate('/'); return; }
      setAuthorized(true);
      setLoading(false);
    })();
  }, [navigate]);

  // Load users
  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified, is_suspended, verification_type')
      .order('created_at', { ascending: false })
      .limit(500);
    setUsers((data as any) || []);
  };

  useEffect(() => { if (authorized) loadUsers(); }, [authorized]);

  // Realtime presence (count)
  useEffect(() => {
    if (!authorized) return;
    const channel = supabase.channel('master-control-presence');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await channel.track({ user_id: user.id, online_at: Date.now() });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [authorized]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone_number || '').includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setVerification = async (id: string, type: 'none' | 'gold' | 'blue' | 'gray') => {
    const isVerified = type !== 'none';
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: isVerified, verification_type: isVerified ? type : null })
      .eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: isVerified, verification_type: isVerified ? type : null } : u));
    toast({ title: 'Updated', description: `Verification: ${type}` });
  };

  const toggleBan = async (u: UserRow) => {
    const newVal = !u.is_suspended;
    const { error } = await supabase.from('profiles').update({ is_suspended: newVal }).eq('id', u.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_suspended: newVal } : x));
    toast({ title: newVal ? 'User suspended' : 'User reinstated' });
  };

  const deleteAccount = async (u: UserRow) => {
    if (!confirm(`Permanently mark @${u.username} as deleted?`)) return;
    const { error } = await supabase.from('profiles').update({ is_suspended: true, full_name: '[deleted]' }).eq('id', u.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Account flagged for deletion' });
    loadUsers();
  };

  const sendNotification = async (u: UserRow) => {
    const msg = prompt('Notification message:');
    if (!msg) return;
    const { data: { user: actor } } = await supabase.auth.getUser();
    const { error } = await supabase.from('notifications').insert({
      user_id: u.id,
      actor_id: actor!.id,
      type: 'admin',
      content: msg,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Notification sent' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: NEON }} />
      </div>
    );
  }
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-black text-white" dir="ltr" style={{ fontFamily: 'Inter, SF Pro Display, system-ui' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle at 80% 0%, ${NEON}15, transparent 50%), radial-gradient(circle at 0% 100%, ${NEON}10, transparent 50%)` }} />

      <div className="relative flex min-h-screen">
        {/* Main content */}
        <main className="flex-1 min-w-0 p-8 pr-4">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 rounded-2xl px-6 py-4 backdrop-blur-2xl border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: `${NEON}20`, border: `1px solid ${NEON}40` }}>
                <Activity className="w-5 h-5" style={{ color: NEON }} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">System ID</div>
                <div className="text-sm font-mono text-white/90">G3142-AF26-0x99</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: NEON }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: NEON }} />
                </span>
                <span className="text-xs uppercase tracking-widest" style={{ color: NEON }}>Master Control</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{ background: `${NEON}15`, border: `1px solid ${NEON}40`, color: NEON }}>
                <span className="h-2 w-2 rounded-full" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                <span className="font-semibold">{onlineCount}</span> online
              </div>
            </div>
          </header>

          {/* Stats strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: users.length, icon: Users },
              { label: 'Verified', value: users.filter(u => u.is_verified).length, icon: BadgeCheck },
              { label: 'Suspended', value: users.filter(u => u.is_suspended).length, icon: Ban },
              { label: 'Online Now', value: onlineCount, icon: Activity },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-5 backdrop-blur-2xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-white/40">{s.label}</span>
                  <s.icon className="w-4 h-4" style={{ color: NEON }} />
                </div>
                <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>

          {/* User table */}
          <section className="rounded-2xl backdrop-blur-2xl border overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>
                <h2 className="text-lg font-semibold">User Management</h2>
                <p className="text-xs text-white/40 mt-1">Real-time control over every account on networkk.online</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
                  style={{ background: `${NEON}15`, border: `1px solid ${NEON}50`, color: NEON, boxShadow: `0 0 16px ${NEON}30` }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: NEON }} />
                  {filtered.length} Total
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name, handle, phone…"
                    className="h-10 pl-10 w-72 bg-white/[0.04] border-white/[0.08] text-white text-sm rounded-xl focus:border-[#19e05b]/50"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-white/40">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Verification</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-white/[0.02] transition" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border" style={{ borderColor: `${NEON}30` }}>
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/5 text-white/60 text-xs">{(u.username || '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-white/90 truncate">{u.full_name || u.username || '—'}</div>
                            <div className="text-xs text-white/40 truncate">@{u.username || 'unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white/60 font-mono text-xs">{u.phone_number || '—'}</td>
                      <td className="px-5 py-4">
                        {u.is_suspended ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">Suspended</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: `${NEON}15`, color: NEON, border: `1px solid ${NEON}30` }}>Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs hover:border-[#19e05b]/40 transition">
                            <BadgeCheck className="w-3.5 h-3.5" style={{ color: u.is_verified ? NEON : 'rgba(255,255,255,0.3)' }} />
                            <span className="capitalize">{u.verification_type || 'None'}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black border-white/10 text-white">
                            <DropdownMenuItem onClick={() => setVerification(u.id, 'none')}>None</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setVerification(u.id, 'blue')}>Blue (Verified)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setVerification(u.id, 'gold')}>Gold (Premium)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setVerification(u.id, 'gray')}>Gray (Affiliate)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="View Details" onClick={() => navigate(`/profile/${u.id}`)}><Eye className="w-4 h-4" /></IconBtn>
                          <IconBtn title="Send Notification" onClick={() => sendNotification(u)}><Bell className="w-4 h-4" /></IconBtn>
                          <IconBtn title={u.is_suspended ? 'Unban' : 'Ban'} onClick={() => toggleBan(u)} danger={!u.is_suspended}><Ban className="w-4 h-4" /></IconBtn>
                          <IconBtn title="Delete Account" onClick={() => deleteAccount(u)} danger><Trash2 className="w-4 h-4" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-16 text-center text-white/40 text-sm">No users match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-5 border-t text-xs text-white/50" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>Page <span className="text-white/80">{page}</span> of <span className="text-white/80">{totalPages}</span></div>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 disabled:opacity-30 hover:border-[#19e05b]/40">Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 disabled:opacity-30 hover:border-[#19e05b]/40">Next</button>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar (right, fixed) */}
        <aside className="w-72 shrink-0 border-l p-6 sticky top-0 h-screen flex flex-col"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(40px)' }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: NEON, boxShadow: `0 0 24px ${NEON}80` }}>
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-base font-bold tracking-tight">NETWORKK</div>
                <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: NEON }}>Master Console</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button key={item.id}
                  onClick={() => { setSection(item.id); if (item.id !== 'overview' && item.id !== 'users') navigate(item.route); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition relative group"
                  style={{
                    background: active ? `${NEON}12` : 'transparent',
                    border: `1px solid ${active ? NEON + '40' : 'transparent'}`,
                    color: active ? NEON : 'rgba(255,255,255,0.65)',
                  }}>
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                  {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full" style={{ background: NEON, boxShadow: `0 0 8px ${NEON}` }} />}
                </button>
              );
            })}
          </nav>

          <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/5 transition">
            <LogOut className="w-4 h-4" />
            <span>Exit Console</span>
          </button>
        </aside>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button title={title} onClick={onClick}
      className={`h-8 w-8 flex items-center justify-center rounded-lg border transition ${
        danger
          ? 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400'
          : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-[#19e05b]/10 hover:border-[#19e05b]/40 hover:text-[#19e05b]'
      }`}>
      {children}
    </button>
  );
}
