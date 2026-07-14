import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLiveStatusSingle } from '@/hooks/useLiveStatus';
import { cn } from '@/lib/utils';

interface LiveRingOverlayProps {
  userId?: string;
  /** Corner radius of the underlying avatar. Use 'full' (default) or '2xl' for squircle business avatars. */
  shape?: 'full' | '2xl';
  /** Show the "LIVE" pill badge. */
  showBadge?: boolean;
  /** Extra offset of the ring outside the avatar, in px. */
  inset?: number;
  className?: string;
  /** When true and user is live, clicking the overlay opens their broadcast. */
  clickable?: boolean;
  badgeSize?: 'sm' | 'md';
}

/**
 * Absolute-positioned Instagram-style LIVE ring + badge overlay.
 * Renders nothing when the user is not live. Place inside a `relative` parent
 * that already contains the avatar image.
 */
export const LiveRingOverlay = ({
  userId,
  shape = 'full',
  showBadge = true,
  inset = 3,
  className,
  clickable = true,
  badgeSize = 'sm',
}: LiveRingOverlayProps) => {
  const navigate = useNavigate();
  const { isLive, roomId } = useLiveStatusSingle(userId);
  if (!isLive) return null;

  const radius = shape === 'full' ? 'rounded-full' : 'rounded-[22px]';

  const handleClick = (e: React.MouseEvent) => {
    if (!clickable) return;
    e.stopPropagation();
    e.preventDefault();
    if (roomId) navigate(`/broadcast?join=${roomId}`);
    else navigate('/broadcast');
  };

  return (
    <div
      className={cn('absolute pointer-events-none', className)}
      style={{ inset: -inset }}
      onClick={clickable ? handleClick : undefined}
    >
      {/* Rotating pink/red gradient ring */}
      <motion.div
        aria-hidden
        className={cn('absolute inset-0', radius)}
        style={{
          background:
            'conic-gradient(from 0deg, #FF1744, #FF4081, #F50057, #FF1744)',
          padding: 2,
          boxShadow:
            '0 0 14px rgba(255,23,68,0.55), 0 0 28px rgba(245,0,87,0.35)',
          willChange: 'transform',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      {/* Pulsing outer glow */}
      <motion.div
        aria-hidden
        className={cn('absolute inset-0', radius)}
        animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.03, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ boxShadow: '0 0 0 2px rgba(255,64,129,0.55)' }}
      />
      {/* Clickable hit-area only when live */}
      {clickable && (
        <div
          className={cn('absolute inset-0 pointer-events-auto cursor-pointer', radius)}
        />
      )}
      {/* LIVE badge */}
      {showBadge && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'absolute left-1/2 -translate-x-1/2 rounded-md font-black tracking-wider text-white z-10 pointer-events-none',
            badgeSize === 'sm'
              ? '-bottom-1.5 px-2 py-[2px] text-[10px]'
              : '-bottom-2 px-2.5 py-[3px] text-[11px]',
          )}
          style={{
            background: 'linear-gradient(135deg, #FF1744, #F50057)',
            boxShadow:
              '0 2px 10px rgba(255,23,68,0.6), 0 0 0 1.5px rgba(0,0,0,0.9)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <motion.span
            className="inline-block"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            LIVE
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

export default LiveRingOverlay;
