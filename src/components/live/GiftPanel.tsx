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
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-t-[24px] border-t border-[#19e05b]/20"
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-white font-bold text-lg">إرسال هدية</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-[#19e05b]/10 border border-[#19e05b]/20 px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4 text-[#19e05b]" />
                  <span className="text-[#19e05b] font-bold">{userBalance}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 px-4 pb-4">
              {GIFTS.map((gift) => (
                <motion.button
                  key={gift.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGift(gift)}
                  className={`relative p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                    selectedGift?.id === gift.id 
                      ? 'bg-[#19e05b]/15 ring-2 ring-[#19e05b]' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="text-white text-xs font-medium">{gift.name}</span>
                  <div className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-[#19e05b]" />
                    <span className="text-[#19e05b] text-xs font-bold">{gift.price}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {selectedGift && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pb-4"
              >
                <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedGift.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{selectedGift.name}</p>
                      <p className="text-white/40 text-sm">{selectedGift.price * amount} عملة</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {[1, 5, 10, 99].map((num) => (
                      <button
                        key={num}
                        onClick={() => setAmount(num)}
                        className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
                          amount === num 
                            ? 'bg-[#19e05b] text-black' 
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

            <div className="px-4 pb-8">
              <Button
                onClick={handleSend}
                disabled={!selectedGift || (selectedGift.price * amount > userBalance)}
                className="w-full h-12 bg-[#19e05b] hover:bg-[#15c74e] text-black font-bold text-lg rounded-2xl disabled:opacity-50 shadow-[0_0_20px_rgba(25,224,91,0.3)]"
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
