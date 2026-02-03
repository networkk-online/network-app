import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

// Mock GIF data - in production, integrate with Giphy/Tenor API
const mockGifs = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHBxNnN6OWVuZ3hzNGN4dWN4eHRtNnBtNnRrZjBxaWZ3ZnA0cnBnbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abldj0b3rxrZUxW/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnA1dTFrNnBtZnN0NXlkbWxjY2VkZnc5cXI0bHJ5bnQxdHpybzBzbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2FwdWRqcDU1cHl1YWVqNXk0dGdhcGJzYWo4ajZtdTc2M2J5cHJxbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgG50Fb7Mi0prBC/giphy.gif',
];

const trendingCategories = [
  'مضحك', 'حب', 'حزين', 'سعيد', 'رقص', 'رياضة', 'حيوانات', 'طعام'
];

export const GifPicker = ({ isOpen, onClose, onSelect }: GifPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [gifs, setGifs] = useState<string[]>(mockGifs);

  useEffect(() => {
    if (searchQuery) {
      setLoading(true);
      // Simulate API call - in production, call Giphy/Tenor API
      const timer = setTimeout(() => {
        setGifs(mockGifs);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setGifs(mockGifs);
    }
  }, [searchQuery]);

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
            className="absolute bottom-full left-0 mb-2 z-50 w-80"
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
                    placeholder="ابحث عن GIF..."
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Trending Categories */}
              <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide border-b border-white/10">
                {trendingCategories.map((category) => (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchQuery(category)}
                    className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs whitespace-nowrap hover:bg-white/20 transition-colors"
                  >
                    {category}
                  </motion.button>
                ))}
              </div>

              {/* GIF Grid */}
              <ScrollArea className="h-60">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {gifs.map((gif, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onSelect(gif);
                          onClose();
                        }}
                        className="aspect-square rounded-xl overflow-hidden bg-white/5"
                      >
                        <img
                          src={gif}
                          alt="GIF"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Attribution */}
              <div className="p-2 border-t border-white/10 text-center">
                <span className="text-[10px] text-white/30">Powered by GIPHY</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
