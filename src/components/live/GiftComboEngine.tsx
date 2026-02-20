import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ComboLeaderEntry {
  id: string;
  username: string;
  maxCombo: number;
}

interface GiftComboEngineProps {
  roomId?: string;
  onSendGift?: (giftType: string, amount: number) => void;
}

const getComboColor = (combo: number) => {
  if (combo >= 40) return '#ff0040'; // Glowing Red
  if (combo >= 25) return '#ff6600'; // Orange
  if (combo >= 10) return '#ffd700'; // Yellow
  return '#ffffff'; // White
};

const getComboGlow = (combo: number) => {
  if (combo >= 40) return '0 0 30px #ff0040, 0 0 60px #ff004080';
  if (combo >= 25) return '0 0 20px #ff660080';
  if (combo >= 10) return '0 0 15px #ffd70060';
  return '0 0 8px #ffffff40';
};

export const GiftComboEngine = ({ roomId, onSendGift }: GiftComboEngineProps) => {
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ComboLeaderEntry[]>([
    { id: '1', username: 'سيف_العراق', maxCombo: 87 },
    { id: '2', username: 'نور123', maxCombo: 64 },
    { id: '3', username: 'ali_pro', maxCombo: 42 },
  ]);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxComboRef = useRef(0);

  // Treasure chest countdown
  const [chestTimeLeft, setChestTimeLeft] = useState(300); // 5 minutes
  const [chestBounce, setChestBounce] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setChestTimeLeft(prev => {
        if (prev <= 1) {
          setChestBounce(true);
          setTimeout(() => setChestBounce(false), 2000);
          return 300; // Reset
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Realtime leaderboard
  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`combo-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'combo_leaderboard',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        // Refresh leaderboard
        fetchLeaderboard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const fetchLeaderboard = async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('combo_leaderboard')
      .select('id, user_id, max_combo')
      .eq('room_id', roomId)
      .order('max_combo', { ascending: false })
      .limit(5);
    if (data) {
      // Would need to join with profiles for usernames
      setLeaderboard(data.map((d, i) => ({
        id: d.id,
        username: `لاعب ${i + 1}`,
        maxCombo: d.max_combo,
      })));
    }
  };

  const handleGiftClick = useCallback(() => {
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxComboRef.current) maxComboRef.current = newCombo;
      
      // Shake at 50
      if (newCombo === 50) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      }
      
      return newCombo;
    });
    setShowCombo(true);
    onSendGift?.('combo', 1);

    // Reset combo after 2s of inactivity
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    comboTimeoutRef.current = setTimeout(() => {
      setShowCombo(false);
      setTimeout(() => setCombo(0), 300);
    }, 2000);
  }, [onSendGift]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const comboColor = getComboColor(combo);
  const comboGlow = getComboGlow(combo);

  return (
    <>
      {/* Screen shake wrapper */}
      <motion.div
        animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-3, 3, -3, 3, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="contents"
      />

      {/* ═══ COMBO COUNTER — Right Side ═══ */}
      <div className="absolute right-4 top-1/3 flex flex-col items-center gap-3 pointer-events-auto z-30">
        {/* Combo Display */}
        <AnimatePresence>
          {showCombo && combo > 0 && (
            <motion.div
              key={combo}
              initial={{ scale: 0.3, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <motion.span
                className="text-4xl font-black tabular-nums"
                style={{
                  color: comboColor,
                  textShadow: comboGlow,
                  WebkitTextStroke: combo >= 25 ? '1px rgba(255,255,255,0.3)' : 'none',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 0.15 }}
              >
                {combo}x
              </motion.span>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: comboColor, textShadow: `0 0 10px ${comboColor}40` }}
              >
                COMBO!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift Button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleGiftClick}
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: combo > 0
              ? `radial-gradient(circle, ${comboColor}30, transparent)`
              : 'rgba(0,0,0,0.5)',
            border: `2px solid ${combo > 0 ? comboColor : 'rgba(255,255,255,0.15)'}`,
            boxShadow: combo > 0 ? comboGlow : 'none',
          }}
        >
          <motion.div
            animate={combo > 0 ? { rotate: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.3, repeat: combo > 10 ? Infinity : 0 }}
          >
            <Gift className="w-6 h-6" style={{ color: combo > 0 ? comboColor : '#fbbf24' }} />
          </motion.div>
          {/* Pulse ring */}
          {combo > 0 && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${comboColor}` }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>

      {/* ═══ LEADERBOARD — Right Side ═══ */}
      <div className="absolute right-3 top-20 pointer-events-auto z-20">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-2.5 min-w-[120px]">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Top Combo</span>
          </div>
          {leaderboard.slice(0, 3).map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-2 py-1 px-1">
              <span className="text-[10px] font-bold" style={{
                color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32',
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span className="text-[10px] text-white/80 truncate flex-1">{entry.username}</span>
              <span className="text-[10px] font-mono font-bold text-cyan-300">{entry.maxCombo}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TREASURE CHEST — Bottom Center ═══ */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
        <motion.div
          animate={chestBounce ? {
            y: [0, -15, 0, -10, 0, -5, 0],
            scale: [1, 1.1, 1, 1.08, 1, 1.04, 1],
          } : {
            y: [0, -4, 0],
          }}
          transition={chestBounce ? { duration: 1.5 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(255,0,128,0.1))',
            borderColor: chestTimeLeft <= 30 ? '#ff0080' : '#00f0ff',
            boxShadow: chestTimeLeft <= 30
              ? '0 0 20px rgba(255,0,128,0.3), inset 0 0 15px rgba(255,0,128,0.1)'
              : '0 0 15px rgba(0,240,255,0.2), inset 0 0 10px rgba(0,240,255,0.05)',
          }}
        >
          <span className="text-lg">🎁</span>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: chestTimeLeft <= 30 ? '#ff0080' : '#00f0ff' }}>
              Treasure Chest
            </span>
            <span className="text-sm font-mono font-black"
              style={{
                color: chestTimeLeft <= 30 ? '#ff0080' : '#00f0ff',
                textShadow: `0 0 10px ${chestTimeLeft <= 30 ? '#ff008060' : '#00f0ff60'}`,
              }}>
              {formatTime(chestTimeLeft)}
            </span>
          </div>
          <span className="text-lg">💎</span>
        </motion.div>
      </div>
    </>
  );
};
