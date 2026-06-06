import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const MaintenanceGuard = ({ children }: Props) => {
  const [maintenance, setMaintenance] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      const enabled = (settings?.value as any)?.enabled === true;
      setMaintenance(enabled);

      if (enabled) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          setIsOwner(!!roles?.some(r => r.role === 'admin'));
        }
      }
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return null;

  if (maintenance && !isOwner) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#39FF14]/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-black border-2 border-[#39FF14]/40 rounded-full p-8">
            <AlertTriangle className="h-16 w-16 text-[#39FF14]" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-[#39FF14] font-mono mb-4">
          SYSTEM UPGRADE
        </h1>
        <p className="text-gray-400 text-lg mb-2">النظام تحت الصيانة حالياً</p>
        <p className="text-gray-600 text-sm max-w-md">
          نعمل على تحسين تجربتك. سنعود قريباً إن شاء الله.
        </p>
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-[#39FF14]/60 animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
