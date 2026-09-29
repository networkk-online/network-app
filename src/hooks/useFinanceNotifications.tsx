import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const useFinanceNotifications = () => {
  useEffect(() => {
    let userId: string | null = null;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();\n      const user = session?.user;
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel('finance-notifications')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'deposits',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.new.status === 'approved' && payload.old.status === 'pending') {
            toast.success('مبروك يا غالي!', {
              description: `تمت الموافقة! تم إضافة $${payload.new.amount} لرصيدك.`,
              icon: <CheckCircle className="h-5 w-5 text-green-400" />,
              duration: 6000,
            });
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.new.status === 'approved' && payload.old.status === 'pending') {
            toast.success('مبروك يا غالي!', {
              description: `تم التحويل! مبلغ $${payload.new.amount} وصل لحسابك.`,
              icon: <CheckCircle className="h-5 w-5 text-green-400" />,
              duration: 6000,
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setup();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);
};

export default useFinanceNotifications;
