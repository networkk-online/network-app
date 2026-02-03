import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, 
  Copy, 
  Forward, 
  Flag, 
  Trash2, 
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  isOwn: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onReport: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
  onReaction: (emoji: string) => void;
  canDeleteForEveryone?: boolean;
}

const reactions = [
  { emoji: '❤️' },
  { emoji: '😂' },
  { emoji: '👍' },
  { emoji: '😮' },
  { emoji: '😢' },
  { emoji: '😡' },
];

// Spring config for Instagram-like bouncy feel
const springConfig = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
  mass: 0.5
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05
    }
  }
};

const reactionItem = {
  hidden: { scale: 0, y: 10 },
  visible: { 
    scale: 1, 
    y: 0,
    transition: springConfig
  }
};

export const MessageContextMenu = ({
  isOpen,
  position,
  isOwn,
  onClose,
  onReply,
  onCopy,
  onForward,
  onReport,
  onDeleteForMe,
  onDeleteForEveryone,
  onReaction,
  canDeleteForEveryone = true,
}: MessageContextMenuProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteForEveryone = async () => {
    if (!onDeleteForEveryone) return;
    setDeleteLoading(true);
    await onDeleteForEveryone();
    setDeleteLoading(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleAction = (action: () => void) => {
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(5);
    action();
    onClose();
  };

  const menuItems = [
    { icon: Reply, label: 'رد', action: onReply },
    { icon: Copy, label: 'نسخ', action: onCopy },
    { icon: Forward, label: 'إعادة توجيه', action: onForward },
    ...(isOwn ? [] : [{ icon: Flag, label: 'إبلاغ', action: onReport, danger: true }]),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurry Backdrop Overlay - Instagram Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/40"
            style={{ WebkitBackdropFilter: 'blur(20px)' }}
          />
          
          {/* Menu Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={springConfig}
            style={{
              position: 'fixed',
              left: Math.min(Math.max(position.x - 104, 16), window.innerWidth - 224),
              top: Math.min(Math.max(position.y - 60, 60), window.innerHeight - 350),
              zIndex: 9999
            }}
            className="w-52"
          >
            {/* Reactions Bar with Stagger Animation */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between p-2.5 mb-2 rounded-2xl bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/10 shadow-2xl"
              style={{ 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                WebkitBackdropFilter: 'blur(40px)'
              }}
            >
              {reactions.map(({ emoji }) => (
                <motion.button
                  key={emoji}
                  variants={reactionItem}
                  whileHover={{ scale: 1.4, y: -5 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleAction(() => onReaction(emoji))}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-2xl"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>

            {/* Actions Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...springConfig }}
              className="rounded-2xl bg-[#1C1C1E]/90 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
              style={{ 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                WebkitBackdropFilter: 'blur(40px)'
              }}
            >
              {!showDeleteConfirm ? (
                <>
                  {menuItems.map((item, index) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.03 }}
                      whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      onClick={() => handleAction(item.action)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-all active:bg-white/10',
                        item.danger ? 'text-red-400' : 'text-white'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium font-[Inter]">{item.label}</span>
                    </motion.button>
                  ))}

                  {/* Delete Options */}
                  <div className="border-t border-white/10">
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAction(onDeleteForMe)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 active:bg-white/10 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium font-[Inter]">حذف لي</span>
                    </motion.button>

                    {isOwn && canDeleteForEveryone && (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(5);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 active:bg-white/10 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="font-medium font-[Inter]">حذف للجميع</span>
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                /* Delete Confirmation */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springConfig}
                  className="p-4"
                >
                  <p className="text-white text-sm mb-4 text-center font-[Inter]">
                    هل تريد حذف هذه الرسالة للجميع؟
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium active:bg-white/20 transition-colors font-[Inter]"
                    >
                      إلغاء
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteForEveryone}
                      disabled={deleteLoading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium active:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-[Inter]"
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'حذف'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
