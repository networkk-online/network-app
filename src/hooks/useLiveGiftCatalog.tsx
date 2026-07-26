import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GiftCategory = 'popular' | 'vip' | 'luxury' | 'funny' | 'seasonal' | 'legendary';
export type GiftTier = 'basic' | 'premium' | 'super' | 'legendary';

export interface CatalogGift {
  id: string;
  name: string;
  name_ar: string | null;
  emoji: string | null;
  icon_url: string | null;
  category: GiftCategory;
  price_coins: number;
  tier: GiftTier;
  animation_key: string | null;
  combo_enabled: boolean;
  leaderboard_points: number;
  sort_order: number;
}

let cache: CatalogGift[] | null = null;

/** Loads the shared live gift catalog once and caches it. */
export function useLiveGiftCatalog() {
  const [gifts, setGifts] = useState<CatalogGift[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('live_gift_catalog')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        cache = data as CatalogGift[];
        setGifts(cache);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { gifts, loading };
}
