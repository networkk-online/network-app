import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Activity, ShieldAlert } from 'lucide-react';
import AdminMfaChallenge from '@/components/vault/AdminMfaChallenge';

interface Props {
  children: (props: { userId: string; isSuperAdmin: boolean }) => React.ReactNode;
}

/** Idle timeout for the admin panel (ms). */
const IDLE_TIMEOUT = 20 * 60 * 1000;

const OwnerRouteGuard = ({ children }: Props) => {
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'denied' | 'mfa' | 'ok'>('loading');
  const [userId, setUserId] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const idleTimer = useRef<number | null>(null);

  const logAttempt = async (uid: string | null, action: string) => {
    try {
      await supabase.from('security_logs').insert({
        user_id: uid,
        attempted_route: '/G3142-AF26-0x99',
        action_type: action,
        user_agent: navigator.userAgent,
      });
    } catch {
      /* logging must never block the guard */
    }
  };

  const check = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await logAttempt(null, 'unauthorized_access');
        navigate('/not-found', { replace: true });
        return;
      }

      // Server-side role check only — the obscure URL is NOT authentication.
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const roleList = (roles || []).map(r => String(r.role));
      const admin = roleList.includes('admin');
      const superAdmin = roleList.includes('super_admin');

      if (!admin && !superAdmin) {
        await logAttempt(user.id, 'unauthorized_access');
        await supabase.auth.signOut();
        setState('denied');
        return;
      }

      setUserId(user.id);
      setIsSuperAdmin(superAdmin);

      // Super admins must satisfy a second factor (TOTP) for this session.
      if (superAdmin) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel !== 'aal2') {
          setState('mfa');
          return;
        }
      }

      await logAttempt(user.id, 'admin_panel_access');
      setState('ok');
    } catch {
      setState('denied');
    }
  };

  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatic session expiry on inactivity.
  useEffect(() => {
    if (state !== 'ok') return;
    const reset = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(async () => {
        await logAttempt(userId, 'admin_session_idle_expired');
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, IDLE_TIMEOUT);
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, userId]);

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <h1 className="text-white text-lg font-semibold">تم رفض الوصول</h1>
        <p className="text-white/40 text-sm max-w-sm">
          هذه المنطقة مخصّصة لإدارة Networkk فقط. تم تسجيل هذه المحاولة.
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-2 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (state === 'mfa') {
    return <AdminMfaChallenge onVerified={() => { setState('loading'); check(); }} />;
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="h-8 w-8 text-[#39FF14] animate-pulse" />
      </div>
    );
  }

  return <>{children({ userId, isSuperAdmin })}</>;
};

export default OwnerRouteGuard;
