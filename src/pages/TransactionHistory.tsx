import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowDownToLine, ArrowRightLeft, Plus, ShoppingBag, X, Share2, Copy, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type TabType = 'all' | 'topup' | 'transfer' | 'withdraw';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const TAB_CONFIG: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'الكل', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'topup', label: 'تعبئة', icon: <Plus className="w-3.5 h-3.5" /> },
  { id: 'transfer', label: 'تحويل', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  { id: 'withdraw', label: 'سحب', icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'earning': return <Plus className="w-4 h-4" />;
    case 'withdrawal': return <ArrowDownToLine className="w-4 h-4" />;
    case 'transfer': return <ArrowRightLeft className="w-4 h-4" />;
    case 'topup': return <ShoppingBag className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'earning':
    case 'topup': return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' };
    case 'withdrawal': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' };
    case 'transfer': return { bg: 'hsl(var(--primary) / 0.1)', border: 'hsl(var(--primary) / 0.2)', text: 'hsl(var(--primary))' };
    default: return { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)', text: '#9ca3af' };
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return { icon: <CheckCircle className="w-3 h-3" />, label: 'مكتمل', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    case 'pending':
      return { icon: <Clock className="w-3 h-3" />, label: 'بالانتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    case 'failed':
      return { icon: <XCircle className="w-3 h-3" />, label: 'فشل', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    default:
      return { icon: <Clock className="w-3 h-3" />, label: status, color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };
  }
};

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setTransactions(data);
    setLoading(false);
  };

  const filtered = activeTab === 'all'
    ? transactions
    : transactions.filter(t => {
        if (activeTab === 'withdraw') return t.type === 'withdrawal';
        if (activeTab === 'topup') return t.type === 'earning' || t.type === 'topup';
        return t.type === activeTab;
      });

  const isPositive = (type: string) => type === 'earning' || type === 'topup';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted/30">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">سجل العمليات</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-3 overflow-x-auto">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-muted/10 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <p className="font-bold text-foreground text-lg mb-1">لا توجد عمليات بعد</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
              عملياتك المالية ستظهر هنا عند إجراء أي تعبئة أو تحويل أو سحب
            </p>
            <Button onClick={() => navigate('/store')} className="rounded-2xl px-6">
              <ShoppingBag className="w-4 h-4 mr-2" />
              الذهاب للمتجر
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const typeColor = getTypeColor(tx.type);
              const statusBadge = getStatusBadge(tx.status);
              return (
                <motion.button
                  key={tx.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedTx(tx)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border/20 bg-muted/5 hover:bg-muted/10 transition-all text-right"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                    background: typeColor.bg,
                    border: `1px solid ${typeColor.border}`,
                    color: typeColor.text,
                  }}>
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{tx.notes || tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className={`font-black text-sm ${isPositive(tx.type) ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive(tx.type) ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5" style={{ color: statusBadge.color }}>
                      {statusBadge.icon}
                      <span className="text-[9px] font-bold">{statusBadge.label}</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-3xl border border-border/20 p-5 max-w-sm mx-auto"
              style={{ background: 'linear-gradient(180deg, rgba(20,20,30,0.98), rgba(10,10,18,0.99))' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">وصل العملية</h3>
                <button onClick={() => setSelectedTx(null)} className="p-1 rounded-full hover:bg-muted/30">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="text-center mb-4">
                <div className={`text-3xl font-black mb-1 ${isPositive(selectedTx.type) ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive(selectedTx.type) ? '+' : '-'}{Math.abs(selectedTx.amount).toLocaleString()} 💎
                </div>
                <div className="flex items-center justify-center gap-1" style={{ color: getStatusBadge(selectedTx.status).color }}>
                  {getStatusBadge(selectedTx.status).icon}
                  <span className="text-xs font-bold">{getStatusBadge(selectedTx.status).label}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-5 p-3 rounded-xl bg-muted/5 border border-border/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">رقم العملية</span>
                  <span className="font-mono text-xs text-foreground">{selectedTx.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">النوع</span>
                  <span className="text-foreground font-medium">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="text-foreground text-xs">
                    {new Date(selectedTx.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {selectedTx.notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ملاحظات</span>
                    <span className="text-foreground text-xs text-right max-w-[60%]">{selectedTx.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`TX-${selectedTx.id.slice(0,8).toUpperCase()}`);
                    if (navigator.vibrate) navigator.vibrate(20);
                  }}
                  className="flex-1 rounded-2xl border-border/20"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  نسخ الرقم
                </Button>
                <Button className="flex-1 rounded-2xl">
                  <Share2 className="w-4 h-4 mr-1" />
                  مشاركة
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionHistory;
