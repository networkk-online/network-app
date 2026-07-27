import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface CatalogGift {
  id: string;
  name: string;
  name_ar: string | null;
  emoji: string | null;
  category: string;
  price_coins: number;
  tier: 'basic' | 'premium' | 'super' | 'legendary';
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'popular', label: 'شائع' },
  { key: 'vip', label: 'VIP' },
  { key: 'luxury', label: 'فخم' },
  { key: 'legendary', label: 'أسطوري' },
  { key: 'funny', label: 'ممتع' },
  { key: 'seasonal', label: 'موسمي' },
];

export const PremiumGiftDrawer = ({
  open,
  onClose,
  onSend,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (gift: CatalogGift, quantity: number) => void;
  balance: number;
}) => {
  const [gifts, setGifts] = useState<CatalogGift[]>([]);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('live_gift_catalog')
      .select('id,name,name_ar,emoji,category,price_coins,tier')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setGifts(data as CatalogGift[]);
      });
  }, [open]);

  const filtered = useMemo(
    () => gifts.filter((g) => g.category === activeCategory),
    [gifts, activeCategory],
  );
  const selected = gifts.find((g) => g.id === selectedId) || null;
  const totalCost = (selected?.price_coins || 0) * quantity;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[75vh] rounded-t-3xl border-t border-white/10 overflow-hidden flex flex-col"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.98))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--vip-gold))' }} />
                <span className="font-bold text-white">مركز الهدايا</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: 'hsl(var(--vip-gold) / 0.12)',
                    color: 'hsl(var(--vip-gold))',
                    border: '1px solid hsl(var(--vip-gold) / 0.4)',
                  }}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {balance.toLocaleString()}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-full">
                  <X className="w-4 h-4 text-white/70" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setActiveCategory(c.key);
                    setSelectedId(null);
                  }}
                  className={cn(
                    'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border',
                    activeCategory === c.key
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 gap-3">
                {filtered.map((g) => {
                  const isSelected = g.id === selectedId;
                  const tierGlow: Record<string, string> = {
                    basic: 'transparent',
                    premium: 'hsl(var(--live-emerald) / 0.5)',
                    super: 'hsl(var(--vip-gold) / 0.6)',
                    legendary: 'hsl(280 90% 60% / 0.7)',
                  };
                  return (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      key={g.id}
                      onClick={() => setSelectedId(g.id)}
                      className={cn(
                        'relative rounded-2xl p-2.5 flex flex-col items-center gap-1 border transition-all',
                        isSelected
                          ? 'border-white bg-white/10'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                      )}
                      style={{ boxShadow: isSelected ? `0 0 20px ${tierGlow[g.tier]}` : undefined }}
                    >
                      {g.tier !== 'basic' && (
                        <span
                          className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                          style={{
                            background: tierGlow[g.tier].replace('0.5', '0.25').replace('0.6', '0.25').replace('0.7', '0.25'),
                            color: g.tier === 'legendary' ? 'hsl(280 90% 75%)' : g.tier === 'super' ? 'hsl(var(--vip-gold))' : 'hsl(var(--live-emerald-glow))',
                          }}
                        >
                          {g.tier}
                        </span>
                      )}
                      <div className="text-4xl leading-none py-1">{g.emoji || '🎁'}</div>
                      <div className="text-[11px] font-semibold text-white truncate w-full text-center">
                        {g.name_ar || g.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: 'hsl(var(--vip-gold))' }}>
                        <Coins className="w-2.5 h-2.5" />
                        {g.price_coins}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Send bar */}
            {selected && (
              <div className="p-4 border-t border-white/5 flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1 border border-white/10">
                  {[1, 5, 10, 99].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-bold',
                        quantity === q ? 'bg-white text-black' : 'text-white/60 hover:text-white',
                      )}
                    >
                      x{q}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => selected && onSend(selected, quantity)}
                  disabled={balance < totalCost}
                  className="flex-1 rounded-full font-bold h-11"
                  style={{
                    background: 'var(--gradient-emerald)',
                    color: '#fff',
                    boxShadow: '0 0 25px hsl(var(--live-emerald) / 0.5)',
                  }}
                >
                  إرسال · {totalCost.toLocaleString()} 💎
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
