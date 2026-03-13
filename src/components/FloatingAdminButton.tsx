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
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (data?.username === '11556zzaa') setVisible(true);
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
      onClick={() => navigate('/admin-control')}
      className="fixed bottom-20 left-4 z-50 bg-gradient-to-br from-red-600 to-orange-500 text-white p-3 rounded-full shadow-lg shadow-red-900/40 hover:scale-110 transition-transform"
      title="لوحة التحكم"
    >
      <Shield className="h-5 w-5" />
    </button>
  );
};

export default FloatingAdminButton;
