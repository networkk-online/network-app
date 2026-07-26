import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles, Loader2 } from 'lucide-react';
import { useLiveGiftCatalog, type CatalogGift, type GiftCategory } from '@/hooks/useLiveGiftCatalog';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftId: string, amount: number, priceCoins: number) => void;
  userBalance?: number;
}

const CATEGORIES: { key: GiftCategory; label: string; icon: string }[] = [
  { key: 'popular', label: 'الأكثر', icon: '🔥' },
  { key: 'vip', label: 'VIP', icon: '👑' },
  { key: 'luxury', label: 'فاخر', icon: '💎' },
  { key: 'funny', label: 'مرح', icon: '🎉' },
  { key: 'seasonal', label: 'موسمي', icon: '🎁' },
  { key: 'legendary', label: 'أسطوري', icon: '🐉' },
];

const AMOUNTS = [1, 5, 10, 50, 99];

const tierRing: Record<string, string> = {
  basic: 'ring-white/10',
  premium: 'ring-[#19e05b]/40',
  super: 'ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
  legendary: 'ring-fuchsia-500/70 shadow-[0_0_30px_rgba(217,70,239,0.5)]',
};

export const PremiumGiftPanel = ({ isOpen, onClose, onSendGift, userBalance = 0 }: Props) => {
  const { gifts, loading } = useLiveGiftCatalog();
  const [activeCat, setActiveCat] = useState<GiftCategory>('popular');
  const [selected, setSelected] = useState<CatalogGift | null>(null);
  const [amount, setAmount] = useState(1);

  const visible = useMemo(
    () => gifts.filter((g) => g.category === activeCat).sort((a, b) => a.sort_order - b.sort_order),
    [gifts, activeCat],
  );

  const totalCost = selected ? selected.price_coins * amount : 0;
  const canAfford = totalCost <= userBalance;

  const handleSend = () => {
    if (!selected || !canAfford) return;
    onSendGift(selected.id, amount, selected.price_coins);
    setAmount(1);
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-t border-[#19e05b]/20 rounded-t-3xl overflow-hidden max-h-[78vh]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#19e05b]" />
                <span className="text-white font-bold">إرسال هدية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#19e05b]/10 border border-[#19e05b]/30">
                  <Coins className="w-3.5 h-3.5 text-[#19e05b]" />
                  <span className="text-[#19e05b] font-black text-xs">{userBalance.toLocaleString()}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  className={cn(
                    'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all',
                    activeCat === c.key
                      ? 'bg-[#19e05b] text-black border-[#19e05b] shadow-[0_0_12px_rgba(25,224,91,0.4)]'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10',
                  )}
                >
                  <span className="mr-1">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Gift grid */}
            <div className="px-4 pb-4 max-h-[38vh] overflow-y-auto">
              {loading ? (
                <div className="py-10 flex items-center justify-center text-white/50">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : visible.length === 0 ? (
                <p className="py-8 text-center text-white/40 text-sm">لا توجد هدايا في هذه الفئة بعد</p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {visible.map((g) => {
                    const active = selected?.id === g.id;
                    return (
                      <motion.button
                        key={g.id}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelected(g)}
                        className={cn(
                          'group relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3 bg-white/[0.03] border transition-all ring-2',
                          tierRing[g.tier] || tierRing.basic,
                          active
                            ? 'border-[#19e05b] bg-[#19e05b]/10 scale-[1.02]'
                            : 'border-white/5 hover:border-white/15',
                        )}
                      >
                        <span className="text-3xl leading-none group-hover:scale-110 transition-transform">
                          {g.emoji || '🎁'}
                        </span>
                        <span className="text-[10px] text-white/80 font-semibold truncate w-full text-center">
                          {g.name_ar || g.name}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-[#19e05b] font-black">
                          <Coins className="w-2.5 h-2.5" />
                          {g.price_coins.toLocaleString()}
                        </span>
                        {g.tier === 'legendary' && (
                          <span className="absolute top-1 right-1 text-[8px] font-black text-fuchsia-400">★</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send bar */}
            <div className="px-4 py-3 border-t border-white/5 bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                {/* Amount selector */}
                <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
                  {AMOUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setAmount(n)}
                      className={cn(
                        'shrink-0 min-w-[42px] h-9 px-3 rounded-full text-xs font-black border transition',
                        amount === n
                          ? 'bg-[#19e05b] text-black border-[#19e05b]'
                          : 'bg-white/5 text-white/70 border-white/10',
                      )}
                    >
                      x{n}
                    </button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSend}
                  disabled={!selected || !canAfford}
                  className={cn(
                    'h-11 px-5 rounded-full font-black text-sm flex items-center gap-2',
                    selected && canAfford
                      ? 'bg-gradient-to-r from-[#19e05b] to-[#0f8a3a] text-black shadow-[0_0_20px_rgba(25,224,91,0.4)]'
                      : 'bg-white/10 text-white/40',
                  )}
                >
                  {selected && !canAfford ? 'رصيد غير كافٍ' : 'إرسال'}
                  {selected && canAfford && (
                    <span className="flex items-center gap-0.5 text-black/80">
                      <Coins className="w-3 h-3" />
                      {totalCost.toLocaleString()}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
