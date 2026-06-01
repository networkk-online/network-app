import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCountUp } from '@/hooks/useCountUp';

export default function PublicUserCounter() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (!error && count !== null) {
        setTotalUsers(count);
        setLoaded(true);
      }
    };
    fetchCount();
  }, []);

  const animatedCount = useCountUp({
    end: totalUsers,
    duration: 2000,
    delay: 300,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5"
      style={{
        boxShadow:
          '0 20px 60px -12px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Specular shine */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)',
        }}
      />

      {/* Neon accent glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: '#39FF14' }}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p
            className="text-[10px] font-mono tracking-widest uppercase mb-1"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            إجمالي المستخدمين
          </p>
          <p
            className="text-3xl font-extrabold tabular-nums tracking-tight"
            style={{
              color: '#39FF14',
              textShadow: '0 0 18px rgba(57,255,20,0.35), 0 0 40px rgba(57,255,20,0.1)',
            }}
          >
            {loaded ? animatedCount.toLocaleString() : '—'}
          </p>
          <p className="text-[10px] text-white/25 mt-1">Total Members</p>
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'rgba(57,255,20,0.08)',
            border: '1px solid rgba(57,255,20,0.2)',
            boxShadow: '0 0 16px rgba(57,255,20,0.1)',
          }}
        >
          <Users
            className="w-6 h-6"
            style={{ color: '#39FF14' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
