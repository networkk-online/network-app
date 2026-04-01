import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from 'lucide-react';

interface ModeratorPermissions {
  can_ban_users: boolean;
  can_approve_videos: boolean;
  can_view_logs: boolean;
  can_delete_content: boolean;
  can_view_reports: boolean;
  can_manage_comments: boolean;
}

interface Props {
  children: (props: { userId: string; permissions: ModeratorPermissions }) => React.ReactNode;
}

const defaultPermissions: ModeratorPermissions = {
  can_ban_users: false,
  can_approve_videos: false,
  can_view_logs: false,
  can_delete_content: false,
  can_view_reports: true,
  can_manage_comments: false,
};

const ModeratorRouteGuard = ({ children }: Props) => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [permissions, setPermissions] = useState<ModeratorPermissions>(defaultPermissions);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/', { replace: true }); return; }

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const isMod = roles?.some(r => r.role === 'moderator' || r.role === 'admin');
        if (!isMod) { navigate('/', { replace: true }); return; }

        // Fetch permissions
        const { data: perms } = await supabase
          .from('moderator_permissions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (perms) {
          setPermissions({
            can_ban_users: perms.can_ban_users,
            can_approve_videos: perms.can_approve_videos,
            can_view_logs: perms.can_view_logs,
            can_delete_content: perms.can_delete_content,
            can_view_reports: perms.can_view_reports,
            can_manage_comments: perms.can_manage_comments,
          });
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

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Activity className="h-6 w-6 text-[#39FF14] animate-pulse" />
      </div>
    );
  }

  return <>{children({ userId, permissions })}</>;
};

export default ModeratorRouteGuard;
