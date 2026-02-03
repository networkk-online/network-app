import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  readerAvatar?: string;
  readerName?: string;
  className?: string;
}

export const MessageStatusIndicator = ({
  status,
  isOwn,
  readerAvatar,
  readerName,
  className
}: MessageStatusIndicatorProps) => {
  if (!isOwn) return null;

  const springConfig = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfig}
      className={cn('inline-flex items-center', className)}
    >
      {status === 'sending' && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 rounded-full border border-white/50"
        />
      )}

      {status === 'sent' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
        >
          <Check className="w-3.5 h-3.5 text-white/60" />
        </motion.div>
      )}

      {status === 'delivered' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
        >
          <CheckCheck className="w-4 h-4 text-white/60" />
        </motion.div>
      )}

      {status === 'read' && readerAvatar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
          className="relative"
        >
          <img
            src={readerAvatar}
            alt={readerName || 'Reader'}
            className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, ...springConfig }}
            className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-black"
          />
        </motion.div>
      )}

      {status === 'read' && !readerAvatar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springConfig}
        >
          <CheckCheck className="w-4 h-4 text-blue-400" />
        </motion.div>
      )}
    </motion.div>
  );
};
