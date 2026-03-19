import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Film, Radio, TrendingUp, Sparkles, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: FileText, label: 'منشور جديد', path: '/create-post', color: 'hsl(var(--primary))' },
  { icon: Film, label: 'ريل جديد', path: '/create-reel', color: '#a855f7' },
  { icon: Camera, label: 'قصة جديدة', path: '/create-story', color: '#f97316' },
  { icon: Radio, label: 'بث مباشر', path: '/broadcast', color: '#ef4444' },
  { icon: TrendingUp, label: 'إعلان', path: '/manage-ads', color: '#eab308' },
  { icon: Sparkles, label: 'أدوات AI', path: '/ai-tools', color: '#06b6d4' },
];

const CreateSidebar = ({ isOpen, onClose }: CreateSidebarProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[61] flex flex-col"
            style={{
              background: 'rgba(8,8,12,0.85)',
              backdropFilter: 'blur(40px)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '10px 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-foreground">إنشاء</h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </motion.button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-4 space-y-2">
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.path}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.06)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { navigate(item.path); onClose(); }}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateSidebar;
