import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface StoredAccount {
  id: string;
  email: string | undefined;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string;
}

const STORAGE_KEY = 'network_linked_accounts';

const getStoredAccounts = (): StoredAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const setStoredAccounts = (accounts: StoredAccount[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export const useAccountSwitcher = () => {
  const [accounts, setAccounts] = useState<StoredAccount[]>(getStoredAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Save current session as an account
  const saveCurrentSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    const account: StoredAccount = {
      id: session.user.id,
      email: session.user.email,
      username: profile?.username || null,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };

    const existing = getStoredAccounts();
    const filtered = existing.filter(a => a.id !== account.id);
    const updated = [...filtered, account];
    setStoredAccounts(updated);
    setAccounts(updated);
    setActiveAccountId(session.user.id);
  }, []);

  // Track current session
  useEffect(() => {
    saveCurrentSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setActiveAccountId(session.user.id);
        // Update stored tokens for this account
        const existing = getStoredAccounts();
        const idx = existing.findIndex(a => a.id === session.user.id);
        if (idx >= 0) {
          existing[idx].access_token = session.access_token;
          existing[idx].refresh_token = session.refresh_token;
          setStoredAccounts(existing);
          setAccounts([...existing]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [saveCurrentSession]);

  const switchToAccount = useCallback(async (accountId: string) => {
    if (accountId === activeAccountId || switching) return;
    
    setSwitching(true);
    try {
      // Save current session tokens first
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        const existing = getStoredAccounts();
        const idx = existing.findIndex(a => a.id === currentSession.user.id);
        if (idx >= 0) {
          existing[idx].access_token = currentSession.access_token;
          existing[idx].refresh_token = currentSession.refresh_token;
          setStoredAccounts(existing);
        }
      }

      // Find target account
      const target = getStoredAccounts().find(a => a.id === accountId);
      if (!target) throw new Error('Account not found');

      // Switch session
      const { error } = await supabase.auth.setSession({
        access_token: target.access_token,
        refresh_token: target.refresh_token,
      });

      if (error) {
        // Token expired, remove account
        const updated = getStoredAccounts().filter(a => a.id !== accountId);
        setStoredAccounts(updated);
        setAccounts(updated);
        throw error;
      }

      setActiveAccountId(accountId);
    } finally {
      setSwitching(false);
    }
  }, [activeAccountId, switching]);

  const removeAccount = useCallback((accountId: string) => {
    if (accountId === activeAccountId) return; // Can't remove active
    const updated = getStoredAccounts().filter(a => a.id !== accountId);
    setStoredAccounts(updated);
    setAccounts(updated);
  }, [activeAccountId]);

  const addAccountViaLogin = useCallback(() => {
    // We'll navigate to login page with a special flag
    // The login page will save the session and redirect back
    return '/login?add_account=true';
  }, []);

  return {
    accounts,
    activeAccountId,
    switching,
    switchToAccount,
    removeAccount,
    addAccountViaLogin,
    saveCurrentSession,
  };
};
