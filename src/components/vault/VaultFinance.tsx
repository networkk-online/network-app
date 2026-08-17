import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/marketplace';
import { minorToAmount, PAYOUT_STATE_AR } from '@/lib/payments';
import { RefreshCw, ShieldCheck, Radar, Banknote, Webhook } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'الإيرادات', icon: Banknote },
  { id: 'transactions', label: 'المعاملات', icon: ShieldCheck },
  { id: 'webhooks', label: 'إشعارات البوابة', icon: Webhook },
  { id: 'reconciliation', label: 'المطابقة', icon: Radar },
  { id: 'payout_states', label: 'أهلية السحب', icon: Banknote },
];

/** Admin finance center for real-money marketplace payments (IQD). */
const VaultFinance = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [hooks, setHooks] = useState<any[]>([]);
  const [recon, setRecon] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [env, setEnv] = useState<'test' | 'live'>('test');
  const [provider, setProvider] = useState('none');
  const [minPayout, setMinPayout] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, tx, wh, rc, st, pv] = await Promise.all([
      supabase.rpc('mp_admin_finance_overview'),
      supabase
        .from('marketplace_payment_transactions')
        .select('*, order:marketplace_orders(order_number), store:marketplace_stores(name)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('marketplace_webhook_events').select('*').order('received_at', { ascending: false }).limit(50),
      supabase.from('marketplace_reconciliation_items').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('marketplace_stores').select('id,name,slug,status,payout_state,payouts_enabled').order('created_at', { ascending: false }).limit(200),
      supabase.from('marketplace_payment_providers').select('*').order('code'),
    ]);
    const o: any = ov.data || null;
    setOverview(o);
    if (o?.environment) setEnv(o.environment === 'live' ? 'live' : 'test');
    if (o?.provider) setProvider(o.provider);
    setTxns(tx.data || []);
    setHooks(wh.data || []);
    setRecon(rc.data || []);
    setStores(st.data || []);
    setProviders(pv.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: string, args: any, okMsg: string) => {
    const { error } = await supabase.rpc(fn as any, args);
    if (error) toast({ title: 'فشل الإجراء', description: error.message, variant: 'destructive' });
    else { toast({ title: okMsg }); load(); }
  };

  const openRecon = useMemo(() => recon.filter((r) => ['open', 'investigating'].includes(r.status)), [recon]);

  const stat = (label: string, value: any) => (
    <div key={label} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
      <p className="text-[11px] text-white/40">{label}</p>
      <p className="text-lg font-bold text-[#39FF14] mt-1">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4 font-[Cairo]" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">مركز المالية (أموال حقيقية)</h2>
          <p className="text-[11px] text-white/40">منفصل تمامًا عن محفظة R Coin والهدايا الرقمية</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="rounded-xl border-white/15 gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border flex items-center gap-1.5 min-h-[40px] ${tab === t.id ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-white/[0.05] border-white/[0.08] text-white/70'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
            <p className="text-sm font-bold text-white">بيئة الدفع</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={env} onChange={(e) => setEnv(e.target.value as any)}
                className="bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-2 text-xs text-white">
                <option value="test" className="bg-black">تجريبي (Test)</option>
                <option value="live" className="bg-black">مباشر (Live)</option>
              </select>
              <select value={provider} onChange={(e) => setProvider(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-2 text-xs text-white">
                <option value="none" className="bg-black">بدون بوابة</option>
                {providers.map((p) => <option key={p.code} value={p.code} className="bg-black">{p.label_ar || p.label}</option>)}
              </select>
              <Input value={minPayout} onChange={(e) => setMinPayout(e.target.value)} inputMode="numeric"
                placeholder="حد السحب الأدنى" className="h-10 bg-white/[0.05] border-white/[0.08] text-white text-xs" />
              <Button size="sm" className="bg-[#39FF14] text-black rounded-xl h-10"
                onClick={() => run('mp_admin_set_payment_env', {
                  _environment: env, _provider: provider,
                  _min_payout: minPayout ? Number(minPayout) : null,
                }, 'تم تحديث بيئة الدفع')}>
                حفظ
              </Button>
            </div>
            <p className={`text-[11px] ${overview.provider_ready ? 'text-[#39FF14]' : 'text-amber-400'}`}>
              {overview.provider_ready
                ? 'البوابة جاهزة لاستقبال مدفوعات حقيقية.'
                : 'لم يتم ربط مفاتيح البوابة بعد — الطلبات تُؤكد يدويًا فقط.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stat('إجمالي المبيعات', formatMoney(overview.gross_volume))}
            {stat('إيراد العمولة', formatMoney(overview.commission_revenue))}
            {stat('رسوم البوابة', formatMoney(overview.processor_fees))}
            {stat('الاستردادات', formatMoney(overview.refunds))}
            {stat('أرصدة معلقة للتجار', formatMoney(overview.merchant_pending))}
            {stat('أرصدة متاحة للتجار', formatMoney(overview.merchant_available))}
            {stat('تمت تسويته', formatMoney(overview.settlements_paid))}
            {stat('طلبات سحب معلقة', overview.payouts_pending)}
            {stat('مدفوعات ناجحة', overview.payments_succeeded)}
            {stat('مدفوعات معلقة', overview.payments_pending)}
            {stat('مدفوعات فاشلة', overview.payments_failed)}
            {stat('بنود مطابقة مفتوحة', overview.open_reconciliation)}
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-2">
          {txns.length === 0 && <p className="text-xs text-white/40">لا توجد معاملات بعد.</p>}
          {txns.map((t) => (
            <div key={t.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="flex justify-between text-xs text-white/70">
                <span>{t.order?.order_number} · {t.store?.name}</span>
                <span className={t.kind === 'refund' ? 'text-red-400' : 'text-[#39FF14]'}>
                  {formatMoney(minorToAmount(t.gross_amount_minor, t.currency), t.currency)}
                </span>
              </div>
              <p className="text-[11px] text-white/40">
                {t.provider} · {t.environment} · {t.kind} · مرجع {t.provider_txn_id}
              </p>
              <p className="text-[11px] text-white/40">
                عمولة {formatMoney(minorToAmount(t.commission_minor, t.currency), t.currency)} · رسوم {formatMoney(minorToAmount(t.processor_fee_minor, t.currency), t.currency)} · صافي التاجر {formatMoney(minorToAmount(t.merchant_net_minor, t.currency), t.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-2">
          {hooks.length === 0 && <p className="text-xs text-white/40">لا توجد إشعارات واردة.</p>}
          {hooks.map((h) => (
            <div key={h.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex justify-between text-xs text-white/70">
                <span>{h.provider} · {h.event_type}</span>
                <span className={h.signature_valid ? 'text-[#39FF14]' : 'text-red-400'}>
                  {h.signature_valid ? 'توقيع صحيح' : 'توقيع مرفوض'} · {h.status}
                </span>
              </div>
              {h.error && <p className="text-[11px] text-red-400 mt-1">{h.error}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'reconciliation' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" className="bg-[#39FF14] text-black rounded-xl"
              onClick={() => run('mp_admin_reconcile_scan', {}, 'تم تشغيل المطابقة')}>
              تشغيل فحص المطابقة
            </Button>
            <span className="text-xs text-white/40 self-center">{openRecon.length} بند مفتوح</span>
          </div>
          {recon.map((r) => (
            <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>{r.kind}</span>
                <span className="text-[#39FF14]">{r.status}</span>
              </div>
              <p className="text-[11px] text-white/40">{r.note} · متوقع {r.expected_minor ?? '—'} · فعلي {r.actual_minor ?? '—'}</p>
              <div className="flex gap-2">
                {['investigating', 'resolved', 'ignored'].map((s) => (
                  <Button key={s} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_reconcile_resolve', { _item_id: r.id, _status: s, _note: reason || null }, 'تم التحديث')}>
                    {{ investigating: 'قيد الفحص', resolved: 'تمت المعالجة', ignored: 'تجاهل' }[s]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ملاحظة تُسجل في سجل التدقيق"
            className="bg-white/[0.05] border-white/[0.08] text-white h-10 rounded-xl" />
        </div>
      )}

      {tab === 'payout_states' && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40">لا يمكن للتاجر تفعيل السحب بنفسه — يتطلب توثيق النشاط التجاري (KYC).</p>
          {stores.map((s) => (
            <div key={s.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>{s.name} <span className="text-white/30">@{s.slug}</span></span>
                <span className={s.payouts_enabled ? 'text-[#39FF14]' : 'text-amber-400'}>
                  {PAYOUT_STATE_AR[s.payout_state] || s.payout_state}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['verification_pending', 'verified', 'payout_enabled', 'payout_suspended'].map((st) => (
                  <Button key={st} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_set_payout_state', { _store_id: s.id, _state: st, _reason: reason || null }, 'تم تحديث أهلية السحب')}>
                    {{ verification_pending: 'بانتظار التوثيق', verified: 'موثق', payout_enabled: 'تفعيل السحب', payout_suspended: 'إيقاف السحب' }[st]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultFinance;
