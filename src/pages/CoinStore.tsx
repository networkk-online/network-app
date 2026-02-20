import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gem, Zap, Crown, Rocket, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

// Global exchange rate
const CURRENT_EXCHANGE_RATE = 1500;

const convertToIQD = (amountInUSD: number, exchangeRate: number = CURRENT_EXCHANGE_RATE): string => {
  const iqd = amountInUSD * exchangeRate;
  return iqd.toLocaleString('ar-IQ') + ' IQD';
};

const PACKAGES = [
  { id: 1, coins: 100, priceUSD: 0.99, icon: <Gem className="w-6 h-6" />, popular: false },
  { id: 2, coins: 500, priceUSD: 4.99, icon: <Star className="w-6 h-6" />, popular: false },
  { id: 3, coins: 1000, priceUSD: 9.99, icon: <Zap className="w-6 h-6" />, popular: true },
  { id: 4, coins: 5000, priceUSD: 39.99, icon: <Crown className="w-6 h-6" />, popular: false },
  { id: 5, coins: 10000, priceUSD: 69.99, icon: <Rocket className="w-6 h-6" />, popular: false },
];

const CoinStore = () => {
  const navigate = useNavigate();
  const [showIQD, setShowIQD] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-card">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">متجر العملات</h1>
        </div>
        
        {/* Currency Toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${!showIQD ? 'text-primary' : 'text-muted-foreground'}`}>USD</span>
          <Switch checked={showIQD} onCheckedChange={setShowIQD} />
          <span className={`text-xs font-bold ${showIQD ? 'text-primary' : 'text-muted-foreground'}`}>IQD</span>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card border border-primary/20 rounded-2xl p-5 mb-6 text-center"
          style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.1)' }}
        >
          <Gem className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">رصيدك الحالي</p>
          <p className="text-3xl font-black text-primary">0</p>
        </motion.div>

        {/* Packages */}
        <div className="space-y-3">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all ${
                pkg.popular
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card border-border hover:border-primary/20'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  الأكثر شعبية
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  pkg.popular ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
                }`}>
                  {pkg.icon}
                </div>
                <div>
                  <p className="font-bold text-lg">{pkg.coins.toLocaleString()} 💎</p>
                  <p className="text-xs text-muted-foreground">{pkg.coins} عملة</p>
                </div>
              </div>

              <Button
                variant={pkg.popular ? 'default' : 'outline'}
                className="rounded-xl min-w-[90px] flex flex-col h-auto py-2"
              >
                {showIQD ? (
                  <>
                    <span className="text-sm font-black leading-tight">
                      {(pkg.priceUSD * CURRENT_EXCHANGE_RATE).toLocaleString('ar-IQ')}
                    </span>
                    <span className="text-[9px] opacity-70">IQD</span>
                  </>
                ) : (
                  <>
                    <span className="text-base font-black leading-tight">${pkg.priceUSD}</span>
                    <span className="text-[9px] opacity-60">
                      {convertToIQD(pkg.priceUSD)}
                    </span>
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Redeem Gift Card Link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/redeem')}
          className="w-full mt-6 p-4 rounded-2xl border border-dashed border-border hover:border-primary/30 text-center transition-colors"
        >
          <span className="text-sm text-muted-foreground">لديك بطاقة هدية؟ </span>
          <span className="text-sm text-primary font-bold">استردها الآن →</span>
        </motion.button>
      </div>
    </div>
  );
};

export default CoinStore;
