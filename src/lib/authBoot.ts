// Synchronous, network-free auth probe used at app boot.
// Supabase persists the session in localStorage under `sb-<ref>-auth-token`.
// Reading it directly lets us route to Home / Login instantly, before the
// async getSession() round-trip resolves.

export const hasCachedSession = (): boolean => {
  try {
    const ls = window.localStorage;
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = ls.getItem(key);
      if (!raw) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const session = parsed?.currentSession ?? parsed;
      if (!session?.access_token) continue;
      // A refresh token means the session can be revived even if expired.
      if (session.refresh_token) return true;
      const expiresAt = Number(session.expires_at ?? 0);
      if (!expiresAt || expiresAt * 1000 > Date.now()) return true;
    }
  } catch {
    // localStorage blocked (iOS private mode / in-app WebView) — assume signed out.
  }
  return false;
};
