import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

interface Props {
  children: (props: { userId: string }) => React.ReactNode;
}

const OwnerRouteGuard = ({ children }: Props) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          await logAttempt(null, '/G3142-AF26-0x99');
          navigate('/not-found', { replace: true });
          return;
        }

        // Server-side role check only — no client-trustable username gating.
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');

        if (!isAdmin) {
          await logAttempt(user.id, '/G3142-AF26-0x99');
          // Auto logout unauthorized users
          await supabase.auth.signOut();
          navigate('/', { replace: true });
          return;
        }

        setUserId(user.id);
        setAuthorized(true);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [navigate]);

  const logAttempt = async (uid: string | null, route: string) => {
    try {
      await supabase.from('security_logs').insert({
        user_id: uid,
        attempted_route: route,
        action_type: 'unauthorized_access',
        user_agent: navigator.userAgent,
      });
    } catch {}
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="h-8 w-8 text-[#39FF14] animate-pulse" />
      </div>
    );
  }

  return <>{children({ userId })}</>;
};

export default OwnerRouteGuard;
