import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';

const FloatingAdminButton = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setVisible(false); return; }
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      setVisible(!!roles?.some(r => r.role === 'admin'));
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => navigate('/G3142-AF26-0x99')}
      className="fixed bottom-20 left-4 z-50 bg-gradient-to-br from-red-600 to-orange-500 text-white p-3 rounded-full shadow-lg shadow-red-900/40 hover:scale-110 transition-transform"
      title="لوحة التحكم"
    >
      <Shield className="h-5 w-5" />
    </button>
  );
};

export default FloatingAdminButton;
