import { ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SwipeableViewProps {
  children: ReactNode;
  onSwipeBack?: () => void;
  swipeThreshold?: number;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export const SwipeableView = ({ 
  children, 
  onSwipeBack,
  swipeThreshold = 100 
}: SwipeableViewProps) => {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, swipeThreshold * 2], [1, 0.5]);
  const scale = useTransform(x, [0, swipeThreshold * 2], [1, 0.95]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x > swipeThreshold) {
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      if (onSwipeBack) {
        onSwipeBack();
      } else {
        navigate(-1);
      }
    }
  }, [navigate, onSwipeBack, swipeThreshold]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.3 }}
      onDragEnd={handleDragEnd}
      style={{ x, opacity, scale }}
      transition={springConfig}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};
