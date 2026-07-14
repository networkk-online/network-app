import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, UserPlus, ShieldAlert, ArrowRight, Clock, X } from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  owner_id: string;
}
interface Affiliate {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
}
interface PendingInvite {
  request_id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const BusinessAffiliates = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setAuthorized(false); setLoading(false); return; }

    const { data: c } = await supabase
      .from('companies')
      .select('id, name, logo_url, owner_id')
      .eq('id', companyId)
      .maybeSingle();

    if (!c || c.owner_id !== uid) {
      setAuthorized(false);
      setCompany(c as Company | null);
      setLoading(false);
      return;
    }
    setCompany(c as Company);
    setAuthorized(true);

    const [{ data: list }, { data: pend }] = await Promise.all([
      supabase.rpc('owner_list_affiliates', { _company_id: companyId }),
      supabase.rpc('owner_list_pending_invites', { _company_id: companyId }),
    ]);
    if (list) setAffiliates(list as Affiliate[]);
    if (pend) setPending(pend as PendingInvite[]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [companyId]);

  const handleInvite = async () => {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return;
    if (clean.length > 40) {
      toast({ title: 'اسم مستخدم غير صالح', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc('owner_invite_affiliate', {
      _username: clean,
      _company_id: companyId,
    });
    setBusy(false);
    const res = data as any;
    if (error || !res?.success) {
      const msg = res?.error === 'user_not_found' ? 'المستخدم غير موجود'
        : res?.error === 'not_company_owner' ? 'ليست لديك صلاحية'
        : res?.error === 'already_invited' ? 'الدعوة مرسلة بالفعل'
        : res?.error === 'already_affiliated' ? 'المستخدم تابع بالفعل'
        : 'فشل الإرسال';
      toast({ title: msg, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم إرسال الدعوة، بانتظار قبول المستخدم' });
    setUsername('');
    loadAll();
  };

  const handleCancelInvite = async (requestId: string) => {
    setBusy(true);
    const { data } = await supabase.rpc('owner_cancel_invite', { _request_id: requestId });
    setBusy(false);
    if ((data as any)?.success) {
      toast({ title: 'تم إلغاء الدعوة' });
      loadAll();
    } else {
      toast({ title: 'فشل الإلغاء', variant: 'destructive' });
    }
  };

  const handleRemove = async (uname: string | null) => {
    if (!uname) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('owner_set_affiliate', {
      _username: uname,
      _company_id: companyId,
      _attach: false,
    });
    setBusy(false);
    const res = data as any;
    if (error || !res?.success) {
      toast({ title: 'فشل الإزالة', variant: 'destructive' });
      return;
    }
    toast({ title: 'تمت الإزالة' });
    loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-md mx-auto pt-24 px-4 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h1 className="text-lg font-bold mb-2">غير مصرح</h1>
          <p className="text-sm text-muted-foreground mb-4">
            هذه الصفحة متاحة فقط لمالك الصفحة التجارية.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">العودة للرئيسية</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="max-w-2xl mx-auto pt-20 pb-10 px-4">
        <button
          onClick={() => navigate('/business')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للإعدادات التجارية
        </button>

        <div className="flex items-center gap-3 mb-6">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-lg object-cover border border-border/40" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {company?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">الحسابات التابعة</h1>
            <p className="text-xs text-muted-foreground">{company?.name}</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-4 mb-6">
          <label className="text-sm font-medium mb-2 block">دعوة حساب تابع</label>
          <div className="flex gap-2">
            <Input
              placeholder="اسم المستخدم بدون @"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              maxLength={40}
              className="flex-1"
            />
            <Button onClick={handleInvite} disabled={busy || !username.trim()} className="gap-1">
              <UserPlus className="w-4 h-4" />
              إرسال الدعوة
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            سيتم إرسال دعوة للمستخدم؛ يظهر الانتساب فقط بعد قبوله.
          </p>
        </div>

        {pending.length > 0 && (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                قيد الانتظار
              </h2>
              <span className="text-xs text-muted-foreground">{pending.length}</span>
            </div>
            <ul className="divide-y divide-border/40">
              {pending.map((p) => (
                <li key={p.request_id} className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={p.avatar_url || '/default-avatar.jpg'}
                    alt={p.username || ''}
                    className="w-10 h-10 rounded-full object-cover border border-border/40"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.full_name || p.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancelInvite(p.request_id)}
                    disabled={busy}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    إلغاء
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold">الحسابات التابعة الحالية</h2>
            <span className="text-xs text-muted-foreground">{affiliates.length}</span>
          </div>
          {affiliates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              لا توجد حسابات تابعة بعد.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {affiliates.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={a.avatar_url || '/default-avatar.jpg'}
                    alt={a.username || ''}
                    className="w-10 h-10 rounded-full object-cover border border-border/40"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm truncate">
                        {a.full_name || a.username}
                      </span>
                      {a.is_verified && <VerifiedBadge size="sm" userId={a.id} username={a.username || ''} />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{a.username}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(a.username)}
                    disabled={busy}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    إزالة
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessAffiliates;
