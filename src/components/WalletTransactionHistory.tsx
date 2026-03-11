import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDownToLine, ArrowRightLeft, FileText, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'in' | 'out';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const isPositive = (type: string) => type === 'earning' || type === 'topup';

const WalletTransactionHistory = ({ userId }: { userId?: string }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!userId) return;
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
    setLoading(false);
  };

  const filtered = filter === 'all'
    ? transactions
    : filter === 'in'
      ? transactions.filter(t => isPositive(t.type))
      : transactions.filter(t => !isPositive(t.type));

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `اليوم، ${time}` : d.toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' }) + ` ${time}`;
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-foreground">سجل العمليات</h3>
        <button onClick={() => navigate('/transactions')} className="text-xs text-primary hover:underline">عرض الكل</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {([
          { id: 'all' as FilterType, label: 'الكل' },
          { id: 'in' as FilterType, label: 'الداخلة (+)' },
          { id: 'out' as FilterType, label: 'الخارجة (-)' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted/10 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-primary/60 text-sm font-medium">لا توجد عمليات بعد.. ابدأ رحلتك الآن! ✨</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.06] hover:bg-white/[0.06] transition-all"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isPositive(tx.type) ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-400'
              }`}>
                {isPositive(tx.type) ? <Plus className="w-3.5 h-3.5" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{tx.notes || tx.type}</p>
                <p className="text-[10px] text-muted-foreground">{formatTime(tx.created_at)}</p>
              </div>
              <span className={`text-sm font-black shrink-0 ${isPositive(tx.type) ? 'text-primary' : 'text-red-400'}`}>
                {isPositive(tx.type) ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletTransactionHistory;
