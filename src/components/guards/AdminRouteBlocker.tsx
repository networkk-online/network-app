import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const BLOCKED_ROUTES = [
  '/admin-networkk-online',
  '/admin/gift-codes',
];

const AdminRouteBlocker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isBlocked = BLOCKED_ROUTES.some(r => location.pathname === r);
    if (!isBlocked) return;

    const logAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      try {
        await supabase.from('security_logs').insert({
          user_id: user?.id || null,
          attempted_route: location.pathname,
          action_type: 'blocked_route_access',
          user_agent: navigator.userAgent,
        });
      } catch {}
      navigate('/not-found', { replace: true });
    };

    logAndRedirect();
  }, [location.pathname, navigate]);

  return null;
};

export default AdminRouteBlocker;
