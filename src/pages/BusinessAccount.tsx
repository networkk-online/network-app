import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { BusinessSettings } from '@/components/BusinessSettings';
import SeoHead from '@/components/seo/SeoHead';
import { supabase } from '@/integrations/supabase/client';
import { Users, ChevronLeft, AlertCircle, Search, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface OwnedCompany {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Invite {
  request_id: string;
  company_id: string;
  company_name: string;
  company_logo: string | null;
}

const BusinessAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [ownedCompanies, setOwnedCompanies] = useState<OwnedCompany[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr || !u.user) {
      setError('يجب تسجيل الدخول لعرض الصفحات التجارية.');
      setLoading(false);
      return;
    }
    setUid(u.user.id);

    const { data, error: cErr } = await supabase
      .from('companies')
      .select('id, name, logo_url, owner_id')
      .eq('owner_id', u.user.id)
      .order('created_at', { ascending: false });

    if (cErr) {
      setError(`تعذر تحميل الصفحات: ${cErr.message}`);
    } else {
      setOwnedCompanies((data as OwnedCompany[]) || []);
    }

    const { data: inv } = await supabase.rpc('user_list_my_invites');
    if (inv) setInvites(inv as Invite[]);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const searchCompanies = async () => {
    if (!searchName.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('companies')
      .select('id, name, logo_url, owner_id')
      .ilike('name', `%${searchName.trim()}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const respond = async (id: string, accept: boolean) => {
    setRespondingId(id);
    const { data, error } = await supabase.rpc('user_respond_affiliation', {
      _request_id: id, _accept: accept,
    });
    setRespondingId(null);
    const res = data as any;
    if (error || !res?.success) {
      toast({ title: 'فشل العملية', variant: 'destructive' });
      return;
    }
    toast({ title: accept ? 'تم قبول الدعوة' : 'تم رفض الدعوة' });
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead route="/business" />
      <Header />
      <main className="max-w-4xl mx-auto pt-20 pb-8 px-4" dir="rtl">
        {/* Pending invitations */}
        {invites.length > 0 && (
          <div className="mb-6 bg-card border border-primary/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
              <h2 className="text-sm font-semibold">دعوات معلقة ({invites.length})</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                دعوات للانضمام كحساب تابع لصفحات تجارية.
              </p>
            </div>
            <ul className="divide-y divide-border/40">
              {invites.map((i) => (
                <li key={i.request_id} className="flex items-center gap-3 px-4 py-3">
                  {i.company_logo ? (
                    <img src={i.company_logo} alt={i.company_name} className="w-10 h-10 rounded-lg object-cover border border-border/40" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                      {i.company_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.company_name}</p>
                    <p className="text-xs text-muted-foreground">قيد الانتظار</p>
                  </div>
                  <Button size="sm" onClick={() => respond(i.request_id, true)} disabled={respondingId === i.request_id} className="gap-1">
                    <Check className="w-4 h-4" />قبول
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => respond(i.request_id, false)} disabled={respondingId === i.request_id} className="gap-1 text-destructive">
                    <X className="w-4 h-4" />رفض
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Owned companies section */}
        <div className="mb-6 bg-card border border-border/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">صفحاتي التجارية</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                إدارة الحسابات التابعة لكل صفحة
              </p>
            </div>
            {uid && (
              <span className="text-[10px] text-muted-foreground font-mono">
                UID: {uid.slice(0, 8)}…
              </span>
            )}
          </div>

          <div className="px-4 py-3 border-b border-border/40">
            <Button variant="outline" className="w-full min-h-[44px]" onClick={() => navigate('/business/store')}>
              متجري في السوق (Marketplace)
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : ownedCompanies.length === 0 ? (
            <div className="px-4 py-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                لا توجد صفحات تجارية مرتبطة بحسابك.
              </p>
              <div className="border border-border/40 rounded-lg p-3 bg-muted/20">
                <label className="text-xs font-medium mb-2 block">
                  ابحث عن صفحتك بالاسم للتأكد من الملكية:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCompanies()}
                    placeholder="اسم الشركة"
                    className="flex-1"
                  />
                  <Button onClick={searchCompanies} disabled={searching || !searchName.trim()} size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {searchResults.map((c) => {
                      const isOwner = c.owner_id === uid;
                      return (
                        <li key={c.id} className="flex items-center gap-2 p-2 rounded bg-background border border-border/30">
                          {c.logo_url ? (
                            <img src={c.logo_url} className="w-8 h-8 rounded object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {c.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm flex-1 truncate">{c.name}</span>
                          {isOwner ? (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/business/${c.id}/affiliates`)}>
                              فتح الإدارة
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">لست المالك</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  إذا كانت الصفحة موجودة لكن ليست لديك ملكية، تواصل مع الدعم لنقل الملكية.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {ownedCompanies.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/business/${c.id}/affiliates`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-right"
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-border/40" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        إدارة الحسابات التابعة
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <BusinessSettings />
      </main>
    </div>
  );
};

export default BusinessAccount;
