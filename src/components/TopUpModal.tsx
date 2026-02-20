import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, CreditCard, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import visaLogo from '@/assets/visa-logo.png';
import mastercardLogo from '@/assets/mastercard-logo.jpg';

const EXCHANGE_RATE = 1500;

const PACKAGES = [
  { id: 1, coins: 100, priceUSD: 0.99, icon: '💎' },
  { id: 2, coins: 500, priceUSD: 4.99, icon: '⭐' },
  { id: 3, coins: 1000, priceUSD: 9.99, icon: '⚡', popular: true },
  { id: 4, coins: 5000, priceUSD: 49.99, icon: '👑' },
  { id: 5, coins: 10000, priceUSD: 99.99, icon: '🚀' },
];

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopUpModal = ({ isOpen, onClose }: TopUpModalProps) => {
  const navigate = useNavigate();
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const formatCode = (value: string) => {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
    return clean.replace(/(.{4})/g, '$1-').slice(0, 14);
  };

  const formatCardNumber = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  const isCodeValid = redeemCode.replace(/-/g, '').length === 12;

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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] border-t max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(8,8,15,0.99) 100%)',
              borderColor: 'rgba(255,215,0,0.15)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(255,215,0,0.3)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
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

            {/* Tabs */}
            <Tabs defaultValue="card" className="px-4 pb-6">
              <TabsList className="w-full grid grid-cols-2 h-11 rounded-xl bg-muted/20 border border-border/20 p-1 mb-4">
                <TabsTrigger value="card" className="rounded-lg text-xs font-bold data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  الدفع الإلكتروني
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-lg text-xs font-bold data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  بطاقة شحن
                </TabsTrigger>
              </TabsList>

              {/* ═══ Tab 1: Card Payment ═══ */}
              <TabsContent value="card" className="mt-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">اختر الباقة</p>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {PACKAGES.map((pkg, i) => (
                    <motion.button
                      key={pkg.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setSelectedPkg(pkg.id); if (navigator.vibrate) navigator.vibrate(15); }}
                      className={`relative p-3 rounded-2xl border text-center transition-all ${
                        pkg.id === selectedPkg
                          ? 'border-[#ffd700]/50 bg-[#ffd700]/5'
                          : 'border-border/20 bg-muted/10 hover:border-border/40'
                      } ${pkg.popular ? 'col-span-2' : ''}`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#000' }}>
                          الأكثر شعبية ⭐
                        </div>
                      )}
                      <span className="text-2xl mb-1 block">{pkg.icon}</span>
                      <p className="font-black text-foreground text-lg">{pkg.coins.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{pkg.coins} عملة</p>
                      <span className="font-black text-foreground">${pkg.priceUSD}</span>
                      <p className="text-[9px] text-muted-foreground">
                        {(pkg.priceUSD * EXCHANGE_RATE).toLocaleString('ar-IQ')} IQD
                      </p>
                    </motion.button>
                  ))}
                </div>

                {/* Card Form */}
                <AnimatePresence>
                  {selectedPkg && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl p-4 mb-4" style={{
                        background: 'linear-gradient(135deg, rgba(100,100,255,0.06), rgba(100,100,255,0.02))',
                        border: '1px solid rgba(100,100,255,0.12)',
                      }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-foreground">بيانات البطاقة</p>
                          <div className="flex gap-1.5">
                            <img src={visaLogo} alt="Visa" className="h-5 rounded object-contain" />
                            <img src={mastercardLogo} alt="Mastercard" className="h-5 rounded object-contain" />
                          </div>
                        </div>
                        <Input
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          className="font-mono text-center tracking-widest bg-background/50 border-border/30 mb-2.5"
                          maxLength={19}
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                          <Input
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            className="font-mono text-center bg-background/50 border-border/30"
                            maxLength={5}
                          />
                          <Input
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            placeholder="CVV"
                            type="password"
                            className="font-mono text-center bg-background/50 border-border/30"
                            maxLength={3}
                          />
                        </div>
                        <div className="flex items-center gap-1 mt-2.5">
                          <ShieldCheck className="w-3 h-3 text-green-400" />
                          <span className="text-[9px] text-muted-foreground">مدفوعات آمنة ومشفرة</span>
                        </div>
                      </div>

                      <Button
                        disabled={cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCVV.length < 3}
                        className="w-full h-12 rounded-2xl font-bold text-base disabled:opacity-40"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff',
                          boxShadow: '0 0 20px rgba(99,102,241,0.25)',
                        }}
                        onClick={() => { if (navigator.vibrate) navigator.vibrate(30); }}
                      >
                        ادفع ${PACKAGES.find(p => p.id === selectedPkg)?.priceUSD}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* ═══ Tab 2: Redeem Code ═══ */}
              <TabsContent value="code" className="mt-0">
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.08))', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <Gift className="w-8 h-8" style={{ color: '#ffd700' }} />
                  </div>
                  <h4 className="font-bold text-foreground text-base mb-1">لديك بطاقة شحن؟</h4>
                  <p className="text-xs text-muted-foreground mb-5 text-center">أدخل رمز البطاقة المكوّن من 12 خانة لتعبئة رصيدك</p>

                  <Input
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(formatCode(e.target.value))}
                    placeholder="XXXX-XXXX-XXXX"
                    className="font-mono text-center text-lg tracking-[0.25em] bg-background/50 border-border/30 h-14 rounded-xl max-w-xs w-full mb-4"
                    maxLength={14}
                    dir="ltr"
                  />

                  <Button
                    onClick={handleRedeem}
                    disabled={!isCodeValid}
                    className="w-full max-w-xs h-12 rounded-2xl font-bold text-base disabled:opacity-40 transition-shadow"
                    style={{
                      background: isCodeValid ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : undefined,
                      color: isCodeValid ? '#000' : undefined,
                      boxShadow: isCodeValid ? '0 0 25px rgba(255,215,0,0.3)' : undefined,
                    }}
                  >
                    تفعيل الكود
                  </Button>
                </div>

                {/* How to buy guide */}
                <button onClick={() => setShowGuide(!showGuide)}
                  className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  كيفية الشراء؟
                </button>
                <AnimatePresence>
                  {showGuide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mx-4 mb-4"
                    >
                      <div className="rounded-xl p-3 bg-muted/10 border border-border/20 space-y-2">
                        {['اشترِ بطاقة شحن من أقرب محل إلكترونيات', 'ستجد رمزاً مكوّناً من 12 خانة خلف البطاقة', 'أدخل الرمز أعلاه واضغط "تفعيل الكود"'].map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-[11px] text-muted-foreground">{step}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TopUpModal;
