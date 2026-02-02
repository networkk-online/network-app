import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: Date;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const OnlineStatus = ({ 
  isOnline, 
  lastSeen, 
  size = 'md',
  showLabel = false 
}: OnlineStatusProps) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'الآن';
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return `منذ ${Math.floor(diff / 1440)} يوم`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            scale: isOnline ? [1, 1.2, 1] : 1,
            opacity: 1
          }}
          transition={{
            scale: { repeat: isOnline ? Infinity : 0, duration: 2 }
          }}
          className={cn(
            sizeClasses[size],
            'rounded-full border-2 border-background',
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          )}
        />
        {isOnline && (
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={cn(
              sizeClasses[size],
              'absolute inset-0 rounded-full bg-green-500'
            )}
          />
        )}
      </div>
      
      {showLabel && (
        <span className="text-xs text-white/60">
          {isOnline ? 'متصل الآن' : (lastSeen ? formatLastSeen(lastSeen) : 'غير متصل')}
        </span>
      )}
    </div>
  );
};
