import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { BusinessSettings } from '@/components/BusinessSettings';
import SeoHead from '@/components/seo/SeoHead';
import { supabase } from '@/integrations/supabase/client';
import { Users, ChevronLeft } from 'lucide-react';

interface OwnedCompany {
  id: string;
  name: string;
  logo_url: string | null;
}

const BusinessAccount = () => {
  const navigate = useNavigate();
  const [ownedCompanies, setOwnedCompanies] = useState<OwnedCompany[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .eq('owner_id', u.user.id)
        .order('created_at', { ascending: false });
      if (data) setOwnedCompanies(data as OwnedCompany[]);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead route="/business" />
      <Header />
      <main className="max-w-4xl mx-auto pt-20 pb-8 px-4" dir="rtl">
        {ownedCompanies.length > 0 && (
          <div className="mb-6 bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <h2 className="text-sm font-semibold">صفحاتي التجارية</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                إدارة الحسابات التابعة لكل صفحة
              </p>
            </div>
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
                        الحسابات التابعة
                      </p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <BusinessSettings />
      </main>
    </div>
  );
};

export default BusinessAccount;
