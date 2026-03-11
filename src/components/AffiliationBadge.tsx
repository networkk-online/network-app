import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AffiliationBadgeProps {
  companyId?: string | null;
  size?: 'sm' | 'md';
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  owner_id: string;
}

const AffiliationBadge = ({ companyId, size = 'md' }: AffiliationBadgeProps) => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const fetchCompany = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url, owner_id')
        .eq('id', companyId)
        .maybeSingle();
      if (data) setCompany(data as Company);
    };
    fetchCompany();
  }, [companyId]);

  if (!companyId || !company) return null;

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <button
      onClick={() => navigate(`/profile/${company.owner_id}`)}
      className="inline-flex items-center gap-1.5 group transition-all"
      title={`تابع لـ ${company.name}`}
    >
      {company.logo_url ? (
        <img
          src={company.logo_url}
          alt={company.name}
          className={`${iconSize} rounded-[4px] object-cover border border-border/30`}
        />
      ) : (
        <div className={`${iconSize} rounded-[4px] bg-primary/10 border border-primary/20 flex items-center justify-center`}>
          <span className="text-[8px] font-bold text-primary">{company.name.charAt(0)}</span>
        </div>
      )}
      <span className={`${textSize} text-muted-foreground group-hover:text-primary transition-colors`}>
        تابع لـ <span className="font-semibold group-hover:text-primary">{company.name}</span>
      </span>
    </button>
  );
};

export default AffiliationBadge;
