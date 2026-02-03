import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  BellOff, 
  Palette, 
  Heart, 
  Image as ImageIcon, 
  Ban, 
  Flag, 
  Trash2, 
  Moon,
  ChevronRight,
  Volume2,
  VolumeX,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser?: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  onMuteToggle?: (muted: boolean) => void;
  onThemeChange?: (theme: string) => void;
  onReactionChange?: (emoji: string) => void;
  onViewMedia?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onClearChat?: () => void;
  isMuted?: boolean;
  vanishMode?: boolean;
  onVanishModeToggle?: (enabled: boolean) => void;
}

const themeColors = [
  { id: 'purple', color: 'bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C]' },
  { id: 'blue', color: 'bg-gradient-to-br from-[#0066FF] to-[#00CCFF]' },
  { id: 'green', color: 'bg-gradient-to-br from-[#00C853] to-[#69F0AE]' },
  { id: 'orange', color: 'bg-gradient-to-br from-[#FF6D00] to-[#FFAB00]' },
  { id: 'pink', color: 'bg-gradient-to-br from-[#FF1744] to-[#FF80AB]' },
  { id: 'dark', color: 'bg-[#262626]' },
];

const defaultReactions = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export const ChatSettingsDrawer = ({
  isOpen,
  onClose,
  otherUser,
  onMuteToggle,
  onThemeChange,
  onReactionChange,
  onViewMedia,
  onBlock,
  onReport,
  onClearChat,
  isMuted = false,
  vanishMode = false,
  onVanishModeToggle,
}: ChatSettingsDrawerProps) => {
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const [selectedReaction, setSelectedReaction] = useState('❤️');
  const [localMuted, setLocalMuted] = useState(isMuted);
  const [localVanishMode, setLocalVanishMode] = useState(vanishMode);

  const handleMuteToggle = (value: boolean) => {
    setLocalMuted(value);
    onMuteToggle?.(value);
  };

  const handleVanishModeToggle = (value: boolean) => {
    setLocalVanishMode(value);
    onVanishModeToggle?.(value);
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onThemeChange?.(themeId);
  };

  const handleReactionSelect = (emoji: string) => {
    setSelectedReaction(emoji);
    onReactionChange?.(emoji);
  };

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

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springConfig}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-[9999] bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">إعدادات المحادثة</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <ScrollArea className="h-[calc(100%-64px)]">
              <div className="p-4 space-y-6">
                {/* User Info */}
                {otherUser && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <img
                      src={otherUser.avatar_url || '/default-avatar.jpg'}
                      alt={otherUser.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-white">{otherUser.full_name}</h3>
                      <p className="text-sm text-white/50">@{otherUser.username}</p>
                    </div>
                  </div>
                )}

                {/* Quick Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/50 px-1">الإعدادات السريعة</h4>
                  
                  {/* Mute Notifications */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      {localMuted ? (
                        <BellOff className="w-5 h-5 text-white/70" />
                      ) : (
                        <Bell className="w-5 h-5 text-white/70" />
                      )}
                      <span className="text-white">كتم الإشعارات</span>
                    </div>
                    <Switch
                      checked={localMuted}
                      onCheckedChange={handleMuteToggle}
                    />
                  </div>

                  {/* Vanish Mode */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-purple-400" />
                      <div>
                        <span className="text-white block">وضع الاختفاء</span>
                        <span className="text-xs text-white/50">الرسائل تختفي بعد المشاهدة</span>
                      </div>
                    </div>
                    <Switch
                      checked={localVanishMode}
                      onCheckedChange={handleVanishModeToggle}
                    />
                  </div>
                </div>

                {/* Theme Colors */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/50 px-1">لون المحادثة</h4>
                  <div className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    {themeColors.map((theme) => (
                      <motion.button
                        key={theme.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleThemeSelect(theme.id)}
                        className={cn(
                          'w-10 h-10 rounded-full',
                          theme.color,
                          selectedTheme === theme.id && 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A]'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Default Reaction */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/50 px-1">التفاعل الافتراضي</h4>
                  <div className="flex gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                    {defaultReactions.map((emoji) => (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReactionSelect(emoji)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors',
                          selectedReaction === emoji 
                            ? 'bg-gradient-to-br from-[#833AB4] to-[#E1306C]' 
                            : 'bg-white/10 hover:bg-white/20'
                        )}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/50 px-1">الإجراءات</h4>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewMedia}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-white/70" />
                      <span>الوسائط والملفات</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50" />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onClearChat}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-white/70" />
                      <span>مسح المحادثة</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50" />
                  </motion.button>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-400/70 px-1">منطقة الخطر</h4>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onBlock}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Ban className="w-5 h-5" />
                      <span>حظر {otherUser?.full_name}</span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onReport}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Flag className="w-5 h-5" />
                      <span>الإبلاغ عن المحادثة</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
