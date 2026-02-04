import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GiftItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  color: string;
}

interface GiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftType: string, amount: number) => void;
  userBalance?: number;
}

const GIFTS: GiftItem[] = [
  { id: 'rose', name: 'وردة', icon: '🌹', price: 1, color: '#ff4757' },
  { id: 'heart', name: 'قلب', icon: '💖', price: 5, color: '#ff6b81' },
  { id: 'star', name: 'نجمة', icon: '⭐', price: 10, color: '#ffd32a' },
  { id: 'crown', name: 'تاج', icon: '👑', price: 50, color: '#f9ca24' },
  { id: 'diamond', name: 'ماسة', icon: '💎', price: 100, color: '#70a1ff' },
  { id: 'lion', name: 'أسد', icon: '🦁', price: 200, color: '#ff9f43' },
  { id: 'rocket', name: 'صاروخ', icon: '🚀', price: 500, color: '#5f27cd' },
  { id: 'galaxy', name: 'مجرة', icon: '🌌', price: 1000, color: '#341f97' },
];

export const GiftPanel = ({ isOpen, onClose, onSendGift, userBalance = 500 }: GiftPanelProps) => {
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [amount, setAmount] = useState(1);

  const handleSend = () => {
    if (selectedGift) {
      onSendGift(selectedGift.id, amount);
      setSelectedGift(null);
      setAmount(1);
      onClose();
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
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
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10"
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-white font-bold text-lg">إرسال هدية</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{userBalance}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Gifts Grid */}
            <div className="grid grid-cols-4 gap-3 px-4 pb-4">
              {GIFTS.map((gift) => (
                <motion.button
                  key={gift.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGift(gift)}
                  className={`relative p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                    selectedGift?.id === gift.id 
                      ? 'bg-white/20 ring-2 ring-pink-500' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="text-white text-xs font-medium">{gift.name}</span>
                  <div className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-bold">{gift.price}</span>
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedGift?.id === gift.id && (
                    <motion.div
                      layoutId="selected-gift"
                      className="absolute inset-0 rounded-2xl border-2 border-pink-500"
                      initial={false}
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Amount Selector */}
            {selectedGift && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pb-4"
              >
                <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedGift.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{selectedGift.name}</p>
                      <p className="text-gray-400 text-sm">{selectedGift.price * amount} عملة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {[1, 5, 10, 99].map((num) => (
                      <button
                        key={num}
                        onClick={() => setAmount(num)}
                        className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                          amount === num 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {num === 99 ? '99+' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Send Button */}
            <div className="px-4 pb-8">
              <Button
                onClick={handleSend}
                disabled={!selectedGift || (selectedGift.price * amount > userBalance)}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold text-lg rounded-xl disabled:opacity-50"
              >
                {selectedGift 
                  ? `إرسال ${selectedGift.name} (${selectedGift.price * amount} عملة)`
                  : 'اختر هدية'
                }
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
