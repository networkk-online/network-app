import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, Zap, Crown, Rocket, Star, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

const EXCHANGE_RATE = 1500;

const PACKAGES = [
  { id: 1, coins: 100, priceUSD: 0.99, icon: <Gem className="w-5 h-5" />, label: '$1' },
  { id: 2, coins: 1000, priceUSD: 9.99, icon: <Zap className="w-5 h-5" />, label: '$10' },
  { id: 3, coins: 5000, priceUSD: 49.99, icon: <Crown className="w-5 h-5" />, label: '$50' },
  { id: 4, coins: 10000, priceUSD: 99.99, icon: <Rocket className="w-5 h-5" />, label: '$100' },
];

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopUpModal = ({ isOpen, onClose }: TopUpModalProps) => {
  const navigate = useNavigate();
  const [redeemCode, setRedeemCode] = useState('');

  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    return clean.replace(/(.{4})/g, '$1-').slice(0, 14);
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl rounded-t-[24px] border-t border-border max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="font-bold text-lg text-foreground">تعبئة الرصيد</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Packages */}
            <div className="px-4 space-y-2.5 pb-4">
              {PACKAGES.map((pkg, i) => (
                <motion.button
                  key={pkg.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/30 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {pkg.icon}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{pkg.coins.toLocaleString()} 💎</p>
                      <p className="text-[10px] text-muted-foreground">{pkg.coins} عملة</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-foreground">${pkg.priceUSD}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(pkg.priceUSD * EXCHANGE_RATE).toLocaleString('ar-IQ')} IQD
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-border" />

            {/* Redeem Code */}
            <div className="p-4 pb-8">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">استرداد بطاقة هدية</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(formatCode(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX"
                  className="font-mono text-center tracking-widest"
                  maxLength={14}
                />
                <Button
                  onClick={() => { onClose(); navigate('/redeem'); }}
                  className="shrink-0"
                >
                  استرداد
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TopUpModal;
