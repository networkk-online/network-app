import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, 
  Copy, 
  Forward, 
  Flag, 
  Trash2, 
  Heart, 
  ThumbsUp,
  Laugh,
  Frown,
  Angry,
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
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { emoji: '😮', icon: null, color: 'text-yellow-400' },
  { emoji: '😢', icon: Frown, color: 'text-blue-400' },
  { emoji: '😡', icon: Angry, color: 'text-red-600' },
];

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'fixed',
              left: Math.min(position.x, window.innerWidth - 220),
              top: Math.min(position.y, window.innerHeight - 350),
              zIndex: 9999
            }}
            className="w-52"
          >
            {/* Reactions Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center justify-between p-2 mb-2 rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 shadow-2xl"
            >
              {reactions.map(({ emoji }, index) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05 + index * 0.03, type: 'spring' }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onReaction(emoji);
                    onClose();
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-xl"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
            >
              {!showDeleteConfirm ? (
                <>
                  {menuItems.map((item, index) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.03 }}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                        'hover:bg-white/10',
                        item.danger ? 'text-red-400' : 'text-white'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </motion.button>
                  ))}

                  {/* Delete Options */}
                  <div className="border-t border-white/10">
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => {
                        onDeleteForMe();
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف لي</span>
                    </motion.button>

                    {isOwn && canDeleteForEveryone && (
                      <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.22 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف للجميع</span>
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                /* Delete Confirmation */
                <div className="p-4">
                  <p className="text-white text-sm mb-4 text-center">
                    هل تريد حذف هذه الرسالة للجميع؟
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      إلغاء
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteForEveryone}
                      disabled={deleteLoading}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'حذف'
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
