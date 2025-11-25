import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Smile, Heart, Star, Sun, Moon, Music, Camera, Gift, Zap, Sparkles, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StickersLibraryProps {
  onStickerSelect: (sticker: string) => void;
}

const stickersData = {
  emoji: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇',
    '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝',
    '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
    '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
    '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '💏', '👩‍❤️‍👨', '💑'
  ],
  reactions: [
    '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
    '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'
  ],
  objects: [
    '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼',
    '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻'
  ],
  nature: [
    '🌸', '💐', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵',
    '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌕', '🌖'
  ],
  food: [
    '🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣',
    '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝'
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
    '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'
  ],
  activities: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸',
    '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊'
  ],
  symbols: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '⭐', '🌟', '✨', '💫',
    '🔥', '💥', '💢', '💯', '✅', '☑️', '❌', '⛔', '🚫', '💯', '💢', '♻️'
  ]
};

const categories = [
  { id: 'emoji', name: 'وجوه', icon: Smile },
  { id: 'hearts', name: 'قلوب', icon: Heart },
  { id: 'reactions', name: 'ردود', icon: Sparkles },
  { id: 'objects', name: 'أشياء', icon: Camera },
  { id: 'nature', name: 'طبيعة', icon: Sun },
  { id: 'food', name: 'طعام', icon: Gift },
  { id: 'animals', name: 'حيوانات', icon: Crown },
  { id: 'activities', name: 'رياضة', icon: Zap },
  { id: 'symbols', name: 'رموز', icon: Star }
];

export const StickersLibrary = ({ onStickerSelect }: StickersLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('emoji');

  const filterStickers = (stickers: string[]) => {
    if (!searchQuery) return stickers;
    return stickers.filter(sticker => 
      sticker.includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-lg">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن ملصق..."
            className="bg-gray-800 border-gray-700 text-white pl-10 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 gap-1 bg-gray-800/50 p-2 rounded-none border-b border-gray-800">
          {categories.slice(0, 5).map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex flex-col items-center gap-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="grid grid-cols-5 gap-1 bg-gray-800/30 p-2 border-b border-gray-800">
          {categories.slice(5).map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
                  activeCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-800 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Stickers Grid */}
        <ScrollArea className="flex-1">
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0 p-4">
              <div className="grid grid-cols-6 gap-3">
                {filterStickers(stickersData[category.id as keyof typeof stickersData]).map((sticker, index) => (
                  <button
                    key={index}
                    onClick={() => onStickerSelect(sticker)}
                    className="text-4xl hover:scale-125 transition-transform active:scale-95 p-2 rounded-lg hover:bg-gray-800"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-500">اضغط على أي ملصق لإضافته</p>
      </div>
    </div>
  );
};
