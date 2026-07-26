import { motion } from 'framer-motion';
import { X, Clock, Eye, Heart, MessageCircle, Users, Gift, Coins, TrendingUp, Share2, Download } from 'lucide-react';

export interface LiveSummary {
  duration_seconds: number;
  views_count: number;
  peak_viewers: number;
  likes_count: number;
  comments_count: number;
  followers_gained: number;
  gift_income_coins: number;
  coins_earned: number;
  estimated_revenue_iqd: number;
  top_supporters: Array<{ username: string; avatar_url?: string; amount: number }>;
}

interface Props {
  summary: LiveSummary;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const fmtDuration = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};
const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : n.toString());

const Stat = ({ icon: Icon, label, value, accent = 'text-white' }: any) => (
  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex flex-col gap-1">
    <Icon className={`w-4 h-4 ${accent}`} />
    <span className="text-[10px] text-white/50 font-semibold">{label}</span>
    <span className={`text-lg font-black ${accent}`}>{value}</span>
  </div>
);

export const LiveSummaryScreen = ({ summary, onClose, onDownload, onShare }: Props) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[70] bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-black overflow-y-auto"
    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <div className="max-w-4xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">ملخص البث المباشر</h1>
          <p className="text-sm text-white/50">أداء رائع! هذه هي أرقامك.</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hero income card */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="rounded-3xl p-6 bg-gradient-to-br from-[#19e05b]/20 via-[#0f8a3a]/10 to-black border border-[#19e05b]/30 shadow-[0_0_40px_rgba(25,224,91,0.15)] mb-5"
      >
        <div className="flex items-center gap-2 text-[#19e05b] text-xs font-black tracking-widest uppercase mb-2">
          <Coins className="w-4 h-4" /> إجمالي الأرباح
        </div>
        <div className="text-5xl font-black text-white leading-none">
          {fmt(summary.gift_income_coins)} <span className="text-lg text-white/50">R Coins</span>
        </div>
        <div className="mt-2 text-sm text-white/60">
          ≈ {summary.estimated_revenue_iqd.toLocaleString()} IQD
        </div>
      </motion.div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Clock} label="المدة" value={fmtDuration(summary.duration_seconds)} accent="text-white" />
        <Stat icon={Eye} label="المشاهدات" value={fmt(summary.views_count)} accent="text-[#19e05b]" />
        <Stat icon={Users} label="ذروة المشاهدين" value={fmt(summary.peak_viewers)} accent="text-amber-300" />
        <Stat icon={Heart} label="الإعجابات" value={fmt(summary.likes_count)} accent="text-rose-400" />
        <Stat icon={MessageCircle} label="التعليقات" value={fmt(summary.comments_count)} accent="text-cyan-300" />
        <Stat icon={TrendingUp} label="متابعون جدد" value={`+${fmt(summary.followers_gained)}`} accent="text-fuchsia-400" />
        <Stat icon={Gift} label="الهدايا" value={fmt(summary.gift_income_coins)} accent="text-yellow-300" />
        <Stat icon={Coins} label="R Coins" value={fmt(summary.coins_earned)} accent="text-[#19e05b]" />
      </div>

      {/* Top supporters */}
      {summary.top_supporters?.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-300" /> أفضل الداعمين
          </h3>
          <div className="space-y-2">
            {summary.top_supporters.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black text-xs font-black">
                  {i + 1}
                </div>
                <span className="flex-1 text-white text-sm font-semibold truncate">{s.username}</span>
                <span className="text-[#19e05b] text-sm font-black flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {fmt(s.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onShare}
          className="flex-1 h-12 rounded-full bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10"
        >
          <Share2 className="w-4 h-4" /> مشاركة النتائج
        </button>
        <button
          onClick={onDownload}
          className="flex-1 h-12 rounded-full bg-[#19e05b] text-black font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(25,224,91,0.4)]"
        >
          <Download className="w-4 h-4" /> تنزيل التقرير
        </button>
      </div>
    </div>
  </motion.div>
);
