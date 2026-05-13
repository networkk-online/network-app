import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLiveStatusSingle } from '@/hooks/useLiveStatus';
import { cn } from '@/lib/utils';

interface LiveAvatarRingProps {
  userId?: string;
  size?: number; // px, of the avatar (inside ring)
  children: React.ReactNode; // avatar element
  onClickFallback?: () => void;
  className?: string;
  showBadge?: boolean;
}

/**
 * Wraps an avatar with a Neon-Green pulsing ring + LIVE badge when the user is live.
 * Clicking a live avatar navigates straight to their broadcast.
 * Verified via Supabase live_streams/live_rooms (G3142 kill-switch hides killed streams).
 */
export const LiveAvatarRing = ({
  userId,
  size = 64,
  children,
  onClickFallback,
  className,
  showBadge = true,
}: LiveAvatarRingProps) => {
  const navigate = useNavigate();
  const { isLive, roomId } = useLiveStatusSingle(userId);

  const handleClick = (e: React.MouseEvent) => {
    if (isLive && roomId) {
      e.stopPropagation();
      e.preventDefault();
      navigate(`/broadcast?join=${roomId}`);
      return;
    }
    onClickFallback?.();
  };

  if (!isLive) {
    return (
      <div className={className} onClick={onClickFallback}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn('relative inline-block cursor-pointer select-none', className)}
      onClick={handleClick}
      style={{ width: size + 8, height: size + 8 }}
    >
      {/* Pulsing neon glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, #39FF14, #08A045, #39FF14)',
          padding: 2,
          boxShadow: '0 0 12px rgba(57,255,20,0.6), 0 0 28px rgba(57,255,20,0.35)',
          willChange: 'transform, opacity',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: '0 0 0 2px rgba(57,255,20,0.5)' }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.04, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner ring (creates the gap) */}
      <div
        className="absolute rounded-full bg-black"
        style={{ inset: 2 }}
      />
      {/* Avatar */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{ inset: 4, width: size, height: size }}
      >
        {children}
      </div>
      {/* LIVE badge */}
      {showBadge && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute left-1/2 -translate-x-1/2 -bottom-1 px-1.5 py-[1px] rounded-md text-[9px] font-bold tracking-wider text-white z-10"
          style={{
            background: '#FF1744',
            boxShadow: '0 2px 8px rgba(255,23,68,0.55), 0 0 0 1.5px #000',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          LIVE
        </motion.div>
      )}
    </div>
  );
};

export default LiveAvatarRing;
