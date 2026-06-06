import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

interface AdminAuthGuardProps {
  children: (props: { currentUserId: string }) => React.ReactNode;
}

const AdminAuthGuard = ({ children }: AdminAuthGuardProps) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/'); return; }

        // Server-side role check only — no client-trustable username gating.
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const isAdminByRole = roles?.some(r => r.role === 'admin');

        if (!isAdminByRole) { navigate('/'); return; }

        setCurrentUserId(user.id);
        setAuthorized(true);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return <>{children({ currentUserId })}</>;
};

export default AdminAuthGuard;
