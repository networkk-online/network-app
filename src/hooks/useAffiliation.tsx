import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  owner_id: string;
}

const cache = new Map<string, Company | null>();

export const useAffiliation = (userId?: string) => {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    if (cache.has(userId)) {
      setCompany(cache.get(userId) || null);
      return;
    }

    const fetch = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('affiliated_company_id')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.affiliated_company_id) {
        cache.set(userId, null);
        return;
      }

      if (cache.has(profile.affiliated_company_id)) {
        const c = cache.get(profile.affiliated_company_id);
        setCompany(c || null);
        cache.set(userId, c || null);
        return;
      }

      const { data: comp } = await supabase
        .from('companies')
        .select('id, name, logo_url, owner_id')
        .eq('id', profile.affiliated_company_id)
        .maybeSingle();

      const result = comp as Company | null;
      cache.set(userId, result);
      if (result) cache.set(result.id, result);
      setCompany(result);
    };
    fetch();
  }, [userId]);

  return company;
};
