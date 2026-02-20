import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, Zap, Crown, Rocket, Star, Gift, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import zaincashLogo from '@/assets/zaincash-logo.jpg';

const EXCHANGE_RATE = 1500;

const PACKAGES = [
  { id: 1, coins: 100, priceUSD: 0.99, icon: '💎', popular: false },
  { id: 2, coins: 500, priceUSD: 4.99, icon: '⭐', popular: false },
  { id: 3, coins: 1000, priceUSD: 9.99, icon: '⚡', popular: true },
  { id: 4, coins: 5000, priceUSD: 49.99, icon: '👑', popular: false },
  { id: 5, coins: 10000, priceUSD: 99.99, icon: '🚀', popular: false },
];

const PAYMENT_METHODS = [
  { id: 'zaincash', name: 'زين كاش', logo: zaincashLogo },
  { id: 'asiahawala', name: 'آسيا حوالة', icon: <Smartphone className="w-5 h-5" /> },
  { id: 'card', name: 'بطاقة بنكية', icon: <CreditCard className="w-5 h-5" /> },
];

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopUpModal = ({ isOpen, onClose }: TopUpModalProps) => {
  const navigate = useNavigate();
  const [redeemCode, setRedeemCode] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    return clean.replace(/(.{4})/g, '$1-').slice(0, 14);
  };

  const handleRedeem = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    onClose();
    navigate('/redeem');
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] border-t max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(8,8,15,0.99) 100%)',
              borderColor: 'rgba(255,215,0,0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(255,215,0,0.3)' }} />
            </div>

            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.15)' }}>
                  <span className="text-lg">💰</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">تعبئة الرصيد</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* ═══ Redeem Code Section ═══ */}
            <div className="mx-4 mb-4 p-3.5 rounded-2xl" style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,165,0,0.03))',
              border: '1px dashed rgba(255,215,0,0.2)',
            }}>
              <div className="flex items-center gap-2 mb-2.5">
                <Gift className="w-4 h-4" style={{ color: '#ffd700' }} />
                <span className="text-sm font-bold text-foreground">لديك كود هدية؟</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(formatCode(e.target.value))}
                  placeholder="XXXX-XXXX-XXXX"
                  className="font-mono text-center tracking-[0.2em] bg-background/50 border-border/50"
                  maxLength={14}
                />
                <Button onClick={handleRedeem} size="sm" className="shrink-0 px-4" style={{
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#000',
                }}>
                  استرداد
                </Button>
              </div>
            </div>

            {/* ═══ Coin Packages Grid ═══ */}
            <div className="px-4 pb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">باقات العملات</p>
              <div className="grid grid-cols-2 gap-2.5">
                {PACKAGES.map((pkg, i) => (
                  <motion.button
                    key={pkg.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPkg(pkg.id);
                      if (navigator.vibrate) navigator.vibrate(15);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-center transition-all ${
                      pkg.id === selectedPkg
                        ? 'border-[#ffd700]/50 bg-[#ffd700]/5'
                        : 'border-border/30 bg-muted/10 hover:border-border/60'
                    } ${pkg.popular ? 'col-span-2' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold" style={{
                        background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                        color: '#000',
                      }}>
                        الأكثر شعبية ⭐
                      </div>
                    )}
                    <span className="text-2xl mb-1 block">{pkg.icon}</span>
                    <p className="font-black text-foreground text-lg">{pkg.coins.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mb-1">{pkg.coins} عملة</p>
                    <div className="flex flex-col items-center">
                      <span className="font-black text-foreground">${pkg.priceUSD}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {(pkg.priceUSD * EXCHANGE_RATE).toLocaleString('ar-IQ')} IQD
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ═══ Payment Methods ═══ */}
            <div className="px-4 pb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">طريقة الدفع</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <motion.button
                    key={method.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPayment(method.id);
                      if (navigator.vibrate) navigator.vibrate(15);
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      selectedPayment === method.id
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/30 bg-muted/10'
                    }`}
                  >
                    {method.logo ? (
                      <img src={method.logo} alt={method.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground">
                        {method.icon}
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-foreground">{method.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ═══ Buy Button ═══ */}
            <div className="px-4 pb-8">
              <Button
                disabled={!selectedPkg || !selectedPayment}
                className="w-full h-12 rounded-2xl font-bold text-base disabled:opacity-40"
                style={{
                  background: selectedPkg && selectedPayment
                    ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                    : undefined,
                  color: selectedPkg && selectedPayment ? '#000' : undefined,
                  boxShadow: selectedPkg && selectedPayment ? '0 0 20px rgba(255,215,0,0.2)' : undefined,
                }}
              >
                {selectedPkg
                  ? `شراء ${PACKAGES.find(p => p.id === selectedPkg)?.coins.toLocaleString()} عملة`
                  : 'اختر باقة'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TopUpModal;
