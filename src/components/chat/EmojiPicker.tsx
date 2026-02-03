import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Smile, Heart, ThumbsUp, Cat, Coffee, Car, Flag, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const categories = [
  { id: 'recent', icon: Clock, label: 'الأخيرة' },
  { id: 'smileys', icon: Smile, label: 'وجوه' },
  { id: 'love', icon: Heart, label: 'حب' },
  { id: 'gestures', icon: ThumbsUp, label: 'إيماءات' },
  { id: 'animals', icon: Cat, label: 'حيوانات' },
  { id: 'food', icon: Coffee, label: 'طعام' },
  { id: 'travel', icon: Car, label: 'سفر' },
  { id: 'flags', icon: Flag, label: 'أعلام' },
  { id: 'music', icon: Music, label: 'أنشطة' },
];

const emojiData: Record<string, string[]> = {
  recent: ['😀', '❤️', '👍', '😂', '🔥', '💯', '🎉', '✨'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷'],
  love: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💋', '💌', '😻', '🥰', '😍', '🤩', '😘'],
  gestures: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🍕', '🍔', '🍟', '☕', '🧁', '🍰'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🗼', '🗽', '🏰', '🏯', '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '⛰️', '🏔️', '🌋', '🏕️', '🏖️', '🏜️', '🏝️'],
  flags: ['🇸🇦', '🇦🇪', '🇪🇬', '🇮🇶', '🇯🇴', '🇰🇼', '🇱🇧', '🇱🇾', '🇲🇦', '🇴🇲', '🇵🇸', '🇶🇦', '🇸🇩', '🇸🇾', '🇹🇳', '🇾🇪', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇹🇷'],
  music: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🥊', '🎮', '🎲', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻'],
};

export const EmojiPicker = ({ isOpen, onClose, onSelect }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = searchQuery
    ? Object.values(emojiData).flat().filter(emoji => emoji.includes(searchQuery))
    : emojiData[activeCategory] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-72"
          >
            <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
                  <Search className="w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
                {categories.map(({ id, icon: Icon }) => (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveCategory(id)}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0',
                      activeCategory === id
                        ? 'bg-[#833AB4] text-white'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>

              {/* Emoji Grid */}
              <ScrollArea className="h-48">
                <div className="grid grid-cols-8 gap-1 p-2">
                  {filteredEmojis.map((emoji, index) => (
                    <motion.button
                      key={`${emoji}-${index}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        onSelect(emoji);
                        onClose();
                      }}
                      className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
