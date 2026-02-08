import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToBottomButtonProps {
  isVisible: boolean;
  onClick: () => void;
  unreadCount?: number;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25
};

export const ScrollToBottomButton = ({ 
  isVisible, 
  onClick, 
  unreadCount = 0 
}: ScrollToBottomButtonProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={springConfig}
          onClick={onClick}
          className={cn(
            'fixed bottom-24 right-4 z-40',
            'w-11 h-11 rounded-full',
            'bg-[#043805] hover:bg-[#054a06]',
            'flex items-center justify-center',
            'shadow-lg shadow-[#043805]/30',
            'border border-[#043805]/50',
            'transition-colors duration-200'
          )}
          style={{
            boxShadow: '0 4px 20px rgba(4, 56, 5, 0.4), 0 0 15px rgba(4, 56, 5, 0.2)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronDown className="w-5 h-5 text-white" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute -top-1.5 -right-1.5',
                'min-w-[20px] h-5 px-1.5',
                'rounded-full bg-red-500 text-white',
                'text-[11px] font-semibold',
                'flex items-center justify-center',
                'border-2 border-black'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};
