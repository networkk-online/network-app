import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gem, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SLICES = [
  { label: '10 Points', value: 10, color: '#08A045' },
  { label: '5 Points', value: 5, color: '#1a1a2e' },
  { label: '20 Points', value: 20, color: '#0d0d1a' },
  { label: '10 Points', value: 10, color: '#08A045' },
  { label: '2 Points', value: 2, color: '#1a1a2e' },
  { label: '50 Points', value: 50, color: '#0d0d1a' },
  { label: '10 Points', value: 10, color: '#08A045' },
  { label: '1 Point', value: 1, color: '#1a1a2e' },
];

const WINNING_SLICE_INDEX = 0; // "10 Points" slice

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  life: number;
}

const RewardsWheel = () => {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [gems, setGems] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [wonPoints, setWonPoints] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [canSpin, setCanSpin] = useState(true);
  const [flyingPoints, setFlyingPoints] = useState(false);
  const tickAudioRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadGems();
    checkSpinAvailability();
  }, []);

  const loadGems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_gems').select('balance').eq('user_id', user.id).maybeSingle();
    if (data) setGems(data.balance);
  };

  const checkSpinAvailability = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('wheel_spins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());
    
    const { data: settings } = await supabase.from('wheel_settings').select('*').limit(1).maybeSingle();
    const maxSpins = settings?.spins_per_day || 1;
    setCanSpin((count || 0) < maxSpins);
  };

  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = tickAudioRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      tickAudioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800 + Math.random() * 400;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [soundEnabled]);

  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = tickAudioRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      tickAudioRef.current = ctx;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch {}
  }, [soundEnabled]);

  const createParticles = () => {
    const colors = ['#08A045', '#FFD700', '#00ff41', '#4ade80', '#fbbf24', '#f472b6', '#818cf8'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        angle: (Math.PI * 2 * i) / 60,
        speed: 3 + Math.random() * 8,
        life: 1,
      });
    }
    setParticles(newParticles);
    // Animate particles
    let frame = 0;
    const animate = () => {
      frame++;
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + Math.cos(p.angle) * p.speed,
        y: p.y + Math.sin(p.angle) * p.speed + frame * 0.1,
        life: Math.max(0, p.life - 0.02),
        speed: p.speed * 0.97,
      })).filter(p => p.life > 0));
      if (frame < 80) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const handleSpin = async () => {
    if (spinning || !canSpin) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('سجل دخولك أولاً');
      return;
    }

    setSpinning(true);

    // Server decides the prize — client never sends an amount
    const { data, error } = await supabase.rpc('spin_wheel' as never, {} as never);
    const result = data as { success?: boolean; prize?: number; balance?: number; spins_left?: number; error?: string } | null;

    if (error || !result?.success) {
      setSpinning(false);
      if (result?.error === 'daily_limit_reached') {
        toast.error('لقد استنفدت محاولاتك لهذا اليوم');
        setCanSpin(false);
      } else if (result?.error === 'wheel_disabled') {
        toast.error('العجلة غير متاحة حالياً');
        setCanSpin(false);
      } else {
        toast.error('تعذر تنفيذ الدوران، حاول لاحقاً');
      }
      return;
    }

    const pointsWon = result.prize ?? 0;

    // Calculate rotation: land on WINNING_SLICE_INDEX (10 Points)
    const sliceAngle = 360 / SLICES.length;
    const targetAngle = 360 - (WINNING_SLICE_INDEX * sliceAngle) - sliceAngle / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const totalRotation = fullSpins * 360 + targetAngle;

    // Tick sound during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      playTick();
      tickCount++;
      if (tickCount > 40) clearInterval(tickInterval);
    }, 80);

    setRotation(prev => prev + totalRotation);

    // After spin completes
    setTimeout(() => {
      clearInterval(tickInterval);
      setSpinning(false);
      setWonPoints(pointsWon);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

      playWinSound();
      createParticles();
      setShowWin(true);

      // Flying points animation
      setTimeout(() => {
        setFlyingPoints(true);
        setTimeout(() => {
          setGems(result.balance ?? 0);
          setFlyingPoints(false);
          setCanSpin((result.spins_left ?? 0) > 0);
        }, 800);
      }, 500);

      setTimeout(() => setShowWin(false), 3000);
    }, 4500);
  };


  const sliceAngle = 360 / SLICES.length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-card/80 backdrop-blur">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-primary/30"
          animate={flyingPoints ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Gem className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary font-mono">{gems}</span>
        </motion.div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-card/80 backdrop-blur">
          {soundEnabled ? <Volume2 className="h-5 w-5 text-foreground" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Title */}
      <div className="text-center mt-2 mb-6 relative z-10">
        <h1 className="text-2xl font-bold text-foreground">عجلة الجواهر</h1>
        <p className="text-sm text-muted-foreground mt-1">أدر العجلة واربح نقاط!</p>
      </div>

      {/* Wheel */}
      <div className="relative flex items-center justify-center z-10" style={{ height: '340px' }}>
        {/* Outer ring glow */}
        <div className="absolute w-[310px] h-[310px] rounded-full border-2 border-primary/40 deep-green-glow" />

        {/* Pointer */}
        <div className="absolute -top-1 z-20 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-primary drop-shadow-lg" 
               style={{ filter: 'drop-shadow(0 0 8px hsl(144 90% 33% / 0.6))' }} />
        </div>

        {/* Wheel SVG */}
        <motion.div
          className="relative"
          style={{ width: 290, height: 290 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4.5, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          <svg viewBox="0 0 300 300" width="290" height="290">
            <defs>
              <filter id="innerShadow">
                <feOffset dx="0" dy="2" />
                <feGaussianBlur stdDeviation="3" />
                <feComposite operator="out" in="SourceGraphic" result="shadow" />
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" in="shadow" />
                <feComposite operator="over" in2="SourceGraphic" />
              </filter>
              <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0a0a15" />
              </radialGradient>
            </defs>

            {/* Outer ring */}
            <circle cx="150" cy="150" r="148" fill="none" stroke="#08A045" strokeWidth="3" opacity="0.6" />
            <circle cx="150" cy="150" r="145" fill="none" stroke="#1a1a2e" strokeWidth="2" />

            {SLICES.map((slice, i) => {
              const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
              const x1 = 150 + 140 * Math.cos(startAngle);
              const y1 = 150 + 140 * Math.sin(startAngle);
              const x2 = 150 + 140 * Math.cos(endAngle);
              const y2 = 150 + 140 * Math.sin(endAngle);
              const largeArc = sliceAngle > 180 ? 1 : 0;

              const textAngle = (i * sliceAngle + sliceAngle / 2 - 90) * (Math.PI / 180);
              const textX = 150 + 95 * Math.cos(textAngle);
              const textY = 150 + 95 * Math.sin(textAngle);
              const textRotation = i * sliceAngle + sliceAngle / 2;

              return (
                <g key={i}>
                  <path
                    d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={slice.color}
                    stroke="#222"
                    strokeWidth="1"
                  />
                  {/* Metallic edge highlight */}
                  <path
                    d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill={slice.value === 10 ? '#fff' : '#ccc'}
                    fontSize={slice.value === 10 ? '11' : '9'}
                    fontWeight={slice.value === 10 ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                    fontFamily="monospace"
                  >
                    {slice.label}
                  </text>
                  {/* Gem icon for 10 Points slices */}
                  {slice.value === 10 && (
                    <text
                      x={150 + 60 * Math.cos(textAngle)}
                      y={150 + 60 * Math.sin(textAngle)}
                      fontSize="16"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${150 + 60 * Math.cos(textAngle)}, ${150 + 60 * Math.sin(textAngle)})`}
                    >
                      💎
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx="150" cy="150" r="30" fill="url(#centerGrad)" stroke="#08A045" strokeWidth="2" />
            <text x="150" y="146" textAnchor="middle" fontSize="11" fill="#08A045" fontWeight="bold" fontFamily="monospace">SPIN</text>
            <text x="150" y="160" textAnchor="middle" fontSize="16">💎</text>

            {/* Decorative dots around edge */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15) * (Math.PI / 180);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={150 + 143 * Math.cos(angle)}
                  cy={150 + 143 * Math.sin(angle)}
                  r="2"
                  fill={i % 2 === 0 ? '#08A045' : '#FFD700'}
                  opacity="0.7"
                />
              );
            })}
          </svg>
        </motion.div>
      </div>

      {/* Spin Button */}
      <div className="flex justify-center mt-8 relative z-10">
        <motion.button
          onClick={handleSpin}
          disabled={spinning || !canSpin}
          className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all ${
            canSpin && !spinning
              ? 'bg-primary text-primary-foreground deep-green-glow'
              : 'bg-card text-muted-foreground border border-border'
          }`}
          whileTap={canSpin && !spinning ? { scale: 0.95 } : {}}
          whileHover={canSpin && !spinning ? { scale: 1.05 } : {}}
        >
          {spinning ? '⏳ جاري الدوران...' : !canSpin ? 'استخدمت دورتك اليوم' : '🎰 أدر العجلة!'}
        </motion.button>
      </div>

      {/* Particles (Jewel Explosion) */}
      <AnimatePresence>
        {particles.map(p => p.life > 0 && (
          <motion.div
            key={p.id}
            className="fixed pointer-events-none z-50 rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.life,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          />
        ))}
      </AnimatePresence>

      {/* Win Dialog */}
      <AnimatePresence>
        {showWin && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border border-primary/40 rounded-3xl p-8 mx-6 text-center max-w-sm"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{ boxShadow: '0 0 40px rgba(8, 160, 69, 0.3), 0 0 80px rgba(8, 160, 69, 0.1)' }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                💎
              </motion.div>
              <h2 className="text-2xl font-bold text-primary mb-2">مبروك! 🎉</h2>
              <p className="text-foreground text-lg">
                ربحت <span className="text-primary font-bold text-2xl">{wonPoints}</span> نقطة!
              </p>
              <motion.div
                className="mt-4 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                تمت إضافتها لرصيدك
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying points animation */}
      <AnimatePresence>
        {flyingPoints && (
          <motion.div
            className="fixed z-50 text-primary font-bold text-2xl"
            initial={{ x: '50%', y: '60%', opacity: 1, scale: 1.5 }}
            animate={{ x: '75%', y: '5%', opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            +{wonPoints} 💎
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RewardsWheel;
