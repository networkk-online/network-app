import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Eye, EyeOff, Gem, Coins, ArrowDownToLine, ArrowRightLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface WalletCardProps {
  balance: number;
  todayEarnings: number;
  totalPosts: number;
}

const WalletCard = ({ balance, todayEarnings, totalPosts }: WalletCardProps) => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    const loadGems = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_gems')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setGems(data.balance);
    };
    loadGems();
  }, []);

  const gemsToUsd = (gems * 0.01).toFixed(2); // 100 gems = $1

  return (
    <div className="mb-6 rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(145deg, rgba(15,15,25,0.95) 0%, rgba(8,8,15,0.98) 100%)',
      backdropFilter: 'blur(40px)',
      border: '1px solid hsl(var(--primary) / 0.15)',
      boxShadow: '0 0 40px hsl(var(--primary) / 0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
    }}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }}>
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">محفظة المبدعين</h3>
              <p className="text-[10px] text-muted-foreground">Elite Creator Wallet</p>
            </div>
          </div>
          <button onClick={() => setHidden(!hidden)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
            {hidden ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Total Balance */}
        <div className="text-center mb-5 py-4 rounded-xl" style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))',
          border: '1px solid hsl(var(--primary) / 0.1)',
        }}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">الرصيد الإجمالي</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {hidden ? '••••••' : `$${balance.toFixed(2)}`}
          </p>
          <p className="text-xs text-primary mt-1">
            {hidden ? '•••' : `+$${todayEarnings.toFixed(2)} اليوم`}
          </p>
        </div>

        {/* Dual Currency */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Network Credits */}
          <div className="rounded-xl p-3.5" style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
            border: '1px solid rgba(255,215,0,0.12)',
          }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Coins className="w-4 h-4" style={{ color: '#FFD700' }} />
              <span className="text-[10px] font-medium" style={{ color: '#FFD700' }}>رصيد نيتورك</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {hidden ? '••••' : `$${balance.toFixed(2)}`}
            </p>
            <p className="text-[10px] text-muted-foreground">قابل للسحب</p>
          </div>

          {/* Gems */}
          <div className="rounded-xl p-3.5" style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.03))',
            border: '1px solid hsl(var(--primary) / 0.15)',
          }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Gem className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-medium text-primary">الجواهر</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {hidden ? '••••' : gems.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">≈ ${gemsToUsd}</p>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="flex items-center justify-center gap-2 py-2 mb-5 rounded-lg bg-muted/20">
          <span className="text-[10px] text-muted-foreground">سعر الصرف:</span>
          <span className="text-[10px] font-medium text-foreground">100 جوهرة = $1.00</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" onClick={() => navigate('/withdraw')}
            className="h-10 text-xs font-medium gap-1.5"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: '0 0 15px hsl(var(--primary) / 0.2)',
            }}>
            <ArrowDownToLine className="w-3.5 h-3.5" />
            سحب
          </Button>
          <Button size="sm" variant="outline"
            className="h-10 text-xs font-medium gap-1.5 border-border/30 bg-muted/10 hover:bg-muted/20">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            تحويل
          </Button>
          <Button size="sm" variant="outline"
            className="h-10 text-xs font-medium gap-1.5 border-border/30 bg-muted/10 hover:bg-muted/20">
            <Plus className="w-3.5 h-3.5" />
            تعبئة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
