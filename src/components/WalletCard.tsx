import { useState, useEffect, useCallback } from 'react';
import { formatNumber } from '@/lib/utils';
import { Wallet, TrendingUp, Eye, EyeOff, Gem, Coins, ArrowDownToLine, ArrowRightLeft, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import TransferModal from './TransferModal';

interface WalletCardProps {
  balance: number;
  todayEarnings: number;
  totalPosts: number;
}

const WalletCard = ({ balance, todayEarnings, totalPosts }: WalletCardProps) => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [gems, setGems] = useState(0);
  const [showTransfer, setShowTransfer] = useState(false);

  const loadGems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_gems')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setGems(Number(data.balance) || 0);
  }, []);

  useEffect(() => {
    loadGems();

    // Subscribe to realtime gems updates
    const channel = supabase
      .channel('wallet-gems-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_gems' }, () => {
        loadGems();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadGems]);

  const gemsToUsd = (gems * 0.01).toFixed(2); // 100 gems = $1
  const networkBalance = Number(balance) || 0;
  const totalBalance = (gems * 0.01) + networkBalance;

  const handleTransferClose = () => {
    setShowTransfer(false);
    loadGems();
  };

  return (
    <section
      aria-label="محفظة المبدعين"
      className="relative mb-6 overflow-hidden rounded-[28px] border"
      style={{
        background: 'linear-gradient(145deg, #101713 0%, #080c0a 52%, #050706 100%)',
        borderColor: 'rgba(201,164,92,0.28)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.28), 0 0 35px rgba(201,164,92,0.07), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full blur-3xl" style={{ background: 'rgba(201,164,92,0.13)' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(201,164,92,0.08)' }} />

      <div className="relative p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border" style={{
              background: 'linear-gradient(145deg, #b9944e, #70552d)',
              borderColor: 'rgba(235,211,155,0.25)',
              boxShadow: '0 5px 20px rgba(201,164,92,0.22)',
            }}>
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide text-white">محفظة المبدعين</h3>
                <Sparkles className="h-3.5 w-3.5" style={{ color: '#E2C783' }} />
              </div>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-[#d8bd7a]/70">NETWORKK • ELITE WALLET</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={hidden ? 'إظهار الأرصدة' : 'إخفاء الأرصدة'}
            aria-pressed={hidden}
            onClick={() => setHidden(!hidden)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[#e8d7ad]/80 transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative mb-5 overflow-hidden rounded-2xl border p-5 sm:p-6" style={{
          background: 'linear-gradient(120deg, rgba(201,164,92,0.18), rgba(201,164,92,0.055) 60%, rgba(255,255,255,0.025))',
          borderColor: 'rgba(201,164,92,0.2)',
        }}>
          <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-8 h-32 w-32 rounded-full border" style={{ borderColor: 'rgba(226,199,131,0.09)' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-4 h-24 w-24 rounded-full border" style={{ borderColor: 'rgba(226,199,131,0.08)' }} />
          <div className="relative">
            <div className="mb-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e8d7ad]/65">
              <ShieldCheck className="h-3.5 w-3.5" />
              الرصيد الإجمالي
            </div>
            <p className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {hidden ? '••••••' : `$${totalBalance.toFixed(2)}`}
            </p>
            <p className="mt-2 text-center text-xs font-medium text-[#e2c783]">
              {hidden ? '•••' : `+$${todayEarnings.toFixed(2)} اليوم`}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4 transition-colors" style={{
            background: 'linear-gradient(145deg, rgba(255,215,0,0.075), rgba(255,215,0,0.018))',
            borderColor: 'rgba(255,215,0,0.16)',
          }}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(255,215,0,0.1)' }}>
                <Coins className="h-4 w-4" style={{ color: '#FFD700' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: '#f5d86e' }}>رصيد نيتورك</span>
            </div>
            <p className="break-words text-xl font-bold text-white">{hidden ? '••••' : `$${networkBalance.toFixed(2)}`}</p>
            <p className="mt-1 text-[10px] text-white/45">الأرباح القابلة للسحب</p>
          </div>

          <div className="rounded-2xl border p-4 transition-colors" style={{
            background: 'linear-gradient(145deg, rgba(192,202,214,0.12), rgba(192,202,214,0.025))',
            borderColor: 'rgba(192,202,214,0.2)',
          }}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'rgba(192,202,214,0.12)' }}>
                <Gem className="h-4 w-4" style={{ color: '#C9D2DE' }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: '#C9D2DE' }}>الجواهر</span>
            </div>
            <p className="break-words text-xl font-bold text-white">{hidden ? '••••' : formatNumber(gems)}</p>
            <p className="mt-1 text-[10px] text-white/45">{hidden ? '•••' : `≈ $${gemsToUsd}`}</p>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border px-3 py-3" style={{
          background: 'rgba(255,255,255,0.025)',
          borderColor: 'rgba(255,255,255,0.065)',
        }}>
          <Gem className="h-3.5 w-3.5 text-[#e2c783]/80" />
          <span className="text-[10px] text-white/55">سعر الصرف</span>
          <span className="text-[11px] font-semibold text-[#e8d7ad]">100 جوهرة = $1.00</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/withdraw')}
            className="h-11 gap-1.5 rounded-xl border-0 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #C9A45C, #92713A)', boxShadow: '0 6px 18px rgba(201,164,92,0.2)' }}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            سحب
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTransfer(true)}
            className="h-11 gap-1.5 rounded-xl border-white/10 bg-white/[0.035] text-xs font-semibold text-white/90 transition-all hover:-translate-y-0.5 hover:border-[#c9a45c]/40 hover:bg-[#c9a45c]/10 hover:text-[#e8d7ad]"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            تحويل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/add-funds')}
            className="h-11 gap-1.5 rounded-xl border-white/10 bg-white/[0.035] text-xs font-semibold text-white/90 transition-all hover:-translate-y-0.5 hover:border-[#c9a45c]/40 hover:bg-[#c9a45c]/10 hover:text-[#e8d7ad]"
          >
            <Plus className="h-3.5 w-3.5" />
            تعبئة
          </Button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium text-white/60 transition-colors hover:border-[#c9a45c]/25 hover:bg-[#c9a45c]/[0.06] hover:text-[#e8d7ad]"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.018)' }}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          سجل العمليات
          <span className="text-white/25">←</span>
        </button>
      </div>

      <TransferModal isOpen={showTransfer} onClose={handleTransferClose} />
    </section>
  );
};

export default WalletCard;
