import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FeatureKey =
  | 'verification_badge'
  | 'analytics'
  | 'business_dashboard'
  | 'government_features'
  | 'priority_support'
  | 'advanced_privacy'
  | 'promotion_tools'
  | 'extended_uploads'
  | 'ad_free'
  | 'team_members'
  | (string & {});

export interface SubscriptionState {
  loading: boolean;
  planId: string;
  planName: string;
  planNameAr: string;
  accent: string;
  badgeColor: string | null;
  status: string;
  expiresAt: string | null;
  features: Record<string, number | null>;
  isFree: boolean;
  isPersonal: boolean;
  isBusiness: boolean;
  isGovernment: boolean;
  has: (key: FeatureKey) => boolean;
  limit: (key: FeatureKey) => number | null;
  refresh: () => Promise<void>;
}

const FREE_STATE = {
  planId: 'free',
  planName: 'Free',
  planNameAr: 'مجاني',
  accent: '#71717a',
  badgeColor: null as string | null,
  status: 'active',
  expiresAt: null as string | null,
  features: {} as Record<string, number | null>,
};

const SubscriptionContext = createContext<SubscriptionState | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(FREE_STATE);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    userIdRef.current = user?.id ?? null;
    if (!user) {
      setState(FREE_STATE);
      setLoading(false);
      return;
    }
    // Server-side resolution: expiry + entitlements are computed in the database.
    const { data, error } = await supabase.rpc('my_entitlements');
    if (error || !data || data.length === 0) {
      setState(FREE_STATE);
      setLoading(false);
      return;
    }
    const rows = data as any[];
    const first = rows[0];
    const features: Record<string, number | null> = {};
    rows.forEach((r) => {
      if (r.feature_key) features[r.feature_key] = r.limit_value ?? null;
    });
    setState({
      planId: first.plan_id ?? 'free',
      planName: first.plan_name ?? 'Free',
      planNameAr: first.plan_name_ar ?? 'مجاني',
      accent: first.accent ?? '#71717a',
      badgeColor: first.badge_color ?? null,
      status: first.status ?? 'active',
      expiresAt: first.expires_at ?? null,
      features,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      // Keep auth callbacks synchronous; defer the data request.
      setTimeout(() => { void load(); }, 0);
    });
    return () => subscription.unsubscribe();
  }, [load]);

  // Live UI switch the moment the subscription row changes (no app update required)
  useEffect(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    const channel = supabase
      .channel(`subscription-${uid}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${uid}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.planId, load]);

  const value = useMemo<SubscriptionState>(() => ({
    loading,
    ...state,
    isFree: state.planId === 'free',
    isPersonal: state.planId === 'personal',
    isBusiness: state.planId === 'business',
    isGovernment: state.planId === 'government',
    has: (key: FeatureKey) => Object.prototype.hasOwnProperty.call(state.features, key),
    limit: (key: FeatureKey) => state.features[key] ?? null,
    refresh: load,
  }), [loading, state, load]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = (): SubscriptionState => {
  const ctx = useContext(SubscriptionContext);
  if (ctx) return ctx;
  // Safe fallback when used outside the provider
  return {
    loading: false,
    ...FREE_STATE,
    isFree: true,
    isPersonal: false,
    isBusiness: false,
    isGovernment: false,
    has: () => false,
    limit: () => null,
    refresh: async () => {},
  };
};

export const useFeature = (key: FeatureKey) => {
  const { has, limit, loading } = useSubscription();
  return { enabled: has(key), limit: limit(key), loading };
};
