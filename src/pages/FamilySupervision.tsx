import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Shield, KeyRound, Users, Clock, MessageSquareOff, Copy, Trash2, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

type Link = { id: string; parent_id: string; teen_id: string; created_at: string; other?: any };
type Restriction = { link_id: string; dm_scope: 'everyone' | 'friends' | 'nobody'; content_filter_level: 'off' | 'standard' | 'strict'; daily_time_limit_minutes: number | null };
type Session = { session_date: string; duration_seconds: number };

const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export default function FamilySupervision() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // parent state
  const [teens, setTeens] = useState<Link[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // teen state
  const [parents, setParents] = useState<Link[]>([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // selection
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [restriction, setRestriction] = useState<Restriction | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<'parent' | 'teen'>('parent');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);
      await loadLinks(user.id);
      setLoading(false);
    })();
  }, [navigate]);

  const loadLinks = async (uid: string) => {
    const { data: asParent } = await supabase.from('family_links').select('*').eq('parent_id', uid);
    const { data: asTeen } = await supabase.from('family_links').select('*').eq('teen_id', uid);
    const attachProfiles = async (rows: any[], otherKey: 'teen_id' | 'parent_id') => {
      if (!rows?.length) return [];
      const ids = rows.map(r => r[otherKey]);
      const { data: profs } = await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', ids);
      return rows.map(r => ({ ...r, other: profs?.find(p => p.id === r[otherKey]) }));
    };
    setTeens(await attachProfiles(asParent || [], 'teen_id'));
    setParents(await attachProfiles(asTeen || [], 'parent_id'));
  };

  const generateCode = async () => {
    if (!userId) return;
    setGeneratingCode(true);
    const code = genCode();
    const { error } = await supabase.from('family_invite_codes').insert({ parent_id: userId, code });
    setGeneratingCode(false);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setActiveCode(code);
  };

  const handleRedeem = async () => {
    if (redeemCode.length !== 6) { toast({ title: 'رمز غير صالح', description: 'أدخل رمزاً من 6 أرقام', variant: 'destructive' }); return; }
    setRedeeming(true);
    const { data, error } = await supabase.rpc('redeem_family_code', { _code: redeemCode });
    setRedeeming(false);
    const res = data as any;
    if (error || !res?.success) {
      toast({ title: 'فشل الربط', description: res?.error || error?.message || 'خطأ', variant: 'destructive' });
      return;
    }
    toast({ title: 'تم الربط بنجاح' });
    setRedeemCode('');
    if (userId) loadLinks(userId);
  };

  const openLink = async (link: Link) => {
    setSelectedLink(link);
    const { data: r } = await supabase.from('family_restrictions').select('*').eq('link_id', link.id).maybeSingle();
    setRestriction(r as any || { link_id: link.id, dm_scope: 'friends', content_filter_level: 'standard', daily_time_limit_minutes: null });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: s } = await supabase
      .from('app_session_activity')
      .select('session_date, duration_seconds')
      .eq('user_id', link.teen_id)
      .gte('session_date', since)
      .order('session_date', { ascending: true });
    // aggregate per date
    const agg: Record<string, number> = {};
    (s || []).forEach((row: any) => { agg[row.session_date] = (agg[row.session_date] || 0) + row.duration_seconds; });
    setSessions(Object.entries(agg).map(([session_date, duration_seconds]) => ({ session_date, duration_seconds })));
  };

  const saveRestrictions = async () => {
    if (!restriction || !selectedLink) return;
    const { error } = await supabase.from('family_restrictions').upsert({
      link_id: selectedLink.id,
      dm_scope: restriction.dm_scope,
      content_filter_level: restriction.content_filter_level,
      daily_time_limit_minutes: restriction.daily_time_limit_minutes,
    }, { onConflict: 'link_id' });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم الحفظ' });
  };

  const removeLink = async (link: Link) => {
    const { error } = await supabase.from('family_links').delete().eq('id', link.id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setSelectedLink(null);
    if (userId) loadLinks(userId);
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  const maxSeconds = Math.max(1, ...sessions.map(s => s.duration_seconds));

  return (
    <div className="min-h-screen bg-black text-white pb-24" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/80 border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
        <Button size="icon" variant="ghost" onClick={() => navigate(-1)} className="rounded-full bg-white/10 hover:bg-white/20 h-9 w-9">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> الإشراف العائلي</h1>
          <p className="text-[11px] text-white/40">اربط حساب ولي الأمر بحساب المراهق بأمان</p>
        </div>
      </div>

      {/* Role toggle */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
        <button onClick={() => { setView('parent'); setSelectedLink(null); }}
          className={`h-10 rounded-xl text-xs font-medium ${view === 'parent' ? 'bg-primary/20 text-primary' : 'text-white/50'}`}>ولي الأمر</button>
        <button onClick={() => { setView('teen'); setSelectedLink(null); }}
          className={`h-10 rounded-xl text-xs font-medium ${view === 'teen' ? 'bg-primary/20 text-primary' : 'text-white/50'}`}>المراهق</button>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {view === 'parent' ? (
          <>
            {/* Generate code */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold"><KeyRound className="w-4 h-4 text-primary" /> رمز إعداد لمرة واحدة</div>
              <p className="text-[12px] text-white/50 mb-3">أنشئ رمزاً مكوناً من 6 أرقام وشاركه مع المراهق ليدخله من حسابه. صالح لمدة 24 ساعة.</p>
              {activeCode ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl bg-black/40 border border-primary/30 text-primary">{activeCode}</div>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(activeCode); toast({ title: 'تم النسخ' }); }} className="rounded-xl bg-white/5"><Copy className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button onClick={generateCode} disabled={generatingCode} className="w-full bg-primary/80 hover:bg-primary rounded-xl">
                  {generatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء رمز'}
                </Button>
              )}
            </div>

            {/* Teens list */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><Users className="w-4 h-4 text-primary" /> الحسابات المُدارة</div>
              {teens.length === 0 ? (
                <p className="text-[12px] text-white/40 text-center py-4">لا توجد حسابات مرتبطة بعد.</p>
              ) : (
                <div className="space-y-2">
                  {teens.map(l => (
                    <button key={l.id} onClick={() => openLink(l)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${selectedLink?.id === l.id ? 'bg-primary/10 border-primary/40' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'}`}>
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs">
                        {l.other?.avatar_url ? <img src={l.other.avatar_url} className="w-full h-full object-cover" /> : (l.other?.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-sm font-medium">{l.other?.full_name || l.other?.username || 'مستخدم'}</div>
                        <div className="text-[11px] text-white/40">@{l.other?.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected teen dashboard */}
            {selectedLink && restriction && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> وقت الاستخدام (آخر 7 أيام)</div>
                  <Button variant="ghost" size="icon" onClick={() => removeLink(selectedLink)} className="text-red-400/70 hover:text-red-400 rounded-xl h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-end gap-1 h-24">
                  {sessions.length === 0 ? (
                    <p className="text-[11px] text-white/40 self-center w-full text-center">لا توجد بيانات بعد.</p>
                  ) : sessions.map(s => (
                    <div key={s.session_date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-primary/70 rounded-t" style={{ height: `${(s.duration_seconds / maxSeconds) * 80}px` }} />
                      <span className="text-[9px] text-white/40">{s.session_date.slice(5)}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2"><MessageSquareOff className="w-4 h-4 text-primary" /> الرسائل المباشرة</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['everyone', 'friends', 'nobody'] as const).map(v => (
                      <button key={v} onClick={() => setRestriction({ ...restriction, dm_scope: v })}
                        className={`h-10 rounded-xl text-[11px] ${restriction.dm_scope === v ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                        {v === 'everyone' ? 'الجميع' : v === 'friends' ? 'الأصدقاء' : 'لا أحد'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">فلتر المحتوى</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['off', 'standard', 'strict'] as const).map(v => (
                      <button key={v} onClick={() => setRestriction({ ...restriction, content_filter_level: v })}
                        className={`h-10 rounded-xl text-[11px] ${restriction.content_filter_level === v ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                        {v === 'off' ? 'إيقاف' : v === 'standard' ? 'قياسي' : 'صارم'}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={saveRestrictions} className="w-full bg-primary/80 hover:bg-primary rounded-xl">حفظ الإعدادات</Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> إدخال رمز الإعداد</div>
              <p className="text-[12px] text-white/50 mb-3">أدخل الرمز المكوّن من 6 أرقام الذي شاركه ولي أمرك.</p>
              <div className="flex gap-2">
                <Input value={redeemCode} onChange={e => setRedeemCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6}
                  placeholder="------" className="flex-1 h-12 text-center text-lg tracking-[0.5em] bg-white/[0.04] border-white/[0.08] rounded-xl" />
                <Button onClick={handleRedeem} disabled={redeeming || redeemCode.length !== 6} className="bg-primary/80 hover:bg-primary rounded-xl px-6">
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ربط'}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl p-4">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> يشرف على حسابك</div>
              {parents.length === 0 ? (
                <p className="text-[12px] text-white/40 text-center py-4">لا يشرف أحد على حسابك.</p>
              ) : (
                <div className="space-y-2">
                  {parents.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs">
                        {l.other?.avatar_url ? <img src={l.other.avatar_url} className="w-full h-full object-cover" /> : (l.other?.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-sm font-medium">{l.other?.full_name || l.other?.username || 'مستخدم'}</div>
                        <div className="text-[11px] text-white/40">@{l.other?.username}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeLink(l)} className="text-red-400/70 hover:text-red-400 rounded-xl h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
