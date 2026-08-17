import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  MP_CATEGORIES, formatMoney, ORDER_STATUS_AR, STORE_STATUS_AR, PRODUCT_STATUS_AR, PAYOUT_STATUS_AR, categoryLabel,
} from '@/lib/marketplace';
import { Store, Package, ShoppingBag, Percent, Wallet, Flag, Scale, RefreshCw, Banknote } from 'lucide-react';
import VaultFinance from './VaultFinance';

const SECTIONS = [
  { id: 'overview', label: 'نظرة عامة', icon: ShoppingBag },
  { id: 'finance', label: 'المالية', icon: Banknote },
  { id: 'stores', label: 'المتاجر', icon: Store },
  { id: 'products', label: 'المنتجات', icon: Package },
  { id: 'orders', label: 'الطلبات', icon: ShoppingBag },
  { id: 'commission', label: 'العمولات', icon: Percent },
  { id: 'payouts', label: 'السحوبات', icon: Wallet },
  { id: 'disputes', label: 'النزاعات', icon: Scale },
  { id: 'reports', label: 'البلاغات', icon: Flag },
];


const VaultMarketplace = () => {
  const { toast } = useToast();
  const [section, setSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');

  const [newRule, setNewRule] = useState({ scope: 'default', store_id: '', category: '', rate: '2', priority: '10' });
  const [refundAmount, setRefundAmount] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, st, pr, or_, po, di, re, ru, se] = await Promise.all([
      supabase.rpc('mp_admin_overview'),
      supabase.from('marketplace_stores').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('marketplace_products').select('*, store:marketplace_stores(name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('marketplace_orders').select('*, store:marketplace_stores(name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('marketplace_payouts').select('*, store:marketplace_stores(name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('marketplace_disputes').select('*, order:marketplace_orders(order_number,total_amount,currency)').order('created_at', { ascending: false }).limit(100),
      supabase.from('marketplace_reports').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('marketplace_commission_rules').select('*').order('priority', { ascending: false }),
      supabase.from('marketplace_settings').select('*').order('key'),
    ]);
    setOverview(ov.data || null);
    setStores(st.data || []); setProducts(pr.data || []); setOrders(or_.data || []);
    setPayouts(po.data || []); setDisputes(di.data || []); setReports(re.data || []);
    setRules(ru.data || []); setSettings(se.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: string, args: any, okMsg: string) => {
    const { error } = await supabase.rpc(fn as any, args);
    if (error) toast({ title: 'فشل الإجراء', description: error.message, variant: 'destructive' });
    else { toast({ title: okMsg }); load(); }
  };

  const filteredStores = useMemo(
    () => stores.filter((s) => !search || s.name?.includes(search) || s.slug?.includes(search)),
    [stores, search],
  );
  const filteredProducts = useMemo(
    () => products.filter((p) => !search || p.name?.includes(search)),
    [products, search],
  );

  const stat = (label: string, value: any, suffix = '') => (
    <div key={label} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
      <p className="text-[11px] text-white/40">{label}</p>
      <p className="text-lg font-bold text-[#39FF14] mt-1">{typeof value === 'number' ? value.toLocaleString('en-US') : value ?? 0}{suffix}</p>
    </div>
  );

  return (
    <div className="space-y-4 font-[Cairo]" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-white">مركز السوق (Marketplace)</h2>
        <Button size="sm" variant="outline" onClick={load} className="rounded-xl border-white/15 gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border flex items-center gap-1.5 min-h-[40px] ${section === s.id ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-white/[0.05] border-white/[0.08] text-white/70'}`}>
            <s.icon className="w-3.5 h-3.5" />{s.label}
          </button>
        ))}
      </div>

      {['stores', 'products'].includes(section) && (
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="bg-white/[0.05] border-white/[0.08] h-11 rounded-xl text-white" />
      )}

      {section === 'overview' && overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stat('المتاجر', overview.stores_total)}
          {stat('بانتظار المراجعة', overview.stores_pending)}
          {stat('المنتجات', overview.products_total)}
          {stat('منتجات للمراجعة', overview.products_pending)}
          {stat('الطلبات', overview.orders_total)}
          {stat('إجمالي المبيعات', formatMoney(overview.gross_sales))}
          {stat('عمولة المنصة', formatMoney(overview.commission_earned))}
          {stat('سحوبات معلقة', overview.payouts_pending)}
          {stat('نزاعات مفتوحة', overview.open_disputes)}
          {stat('بلاغات مفتوحة', overview.open_reports)}
        </div>
      )}

      {section === 'stores' && (
        <div className="space-y-2">
          {filteredStores.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white font-bold truncate">{s.name} <span className="text-white/40 text-xs">@{s.slug}</span></p>
                  <p className="text-[11px] text-white/40">{categoryLabel(s.category)} · عمولة {s.commission_override ?? 'افتراضية'}</p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/70 shrink-0">{STORE_STATUS_AR[s.status]}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['approve', 'reject', 'suspend', 'reinstate', 'feature', 'unfeature'].map((a) => (
                  <Button key={a} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_store_action', { _store_id: s.id, _action: a, _reason: reason || null }, 'تم تنفيذ الإجراء')}>
                    {{ approve: 'قبول', reject: 'رفض', suspend: 'إيقاف', reinstate: 'إعادة تفعيل', feature: 'تمييز', unfeature: 'إلغاء التمييز' }[a]}
                  </Button>
                ))}
                <Input placeholder="عمولة مخصصة %" className="h-8 w-36 bg-white/[0.05] border-white/[0.08] text-white text-[11px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') run('mp_admin_set_store_commission', { _store_id: s.id, _rate: Number((e.target as HTMLInputElement).value), _reason: reason || null }, 'تم تحديث العمولة');
                  }} />
              </div>
            </div>
          ))}
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الإجراء (يُسجل في سجل التدقيق)" className="bg-white/[0.05] border-white/[0.08] text-white" />
        </div>
      )}

      {section === 'products' && (
        <div className="space-y-2">
          {filteredProducts.map((p) => (
            <div key={p.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] overflow-hidden shrink-0">
                {p.image_url && <img src={p.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{p.name}</p>
                <p className="text-[11px] text-white/40">{p.store?.name} · {formatMoney(p.price, p.currency)} · {PRODUCT_STATUS_AR[p.status]}</p>
              </div>
              <div className="flex gap-1.5">
                {['approve', 'reject', 'suspend', 'feature'].map((a) => (
                  <Button key={a} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_product_action', { _product_id: p.id, _action: a, _reason: reason || null }, 'تم تنفيذ الإجراء')}>
                    {{ approve: 'قبول', reject: 'رفض', suspend: 'إيقاف', feature: 'تمييز' }[a]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'orders' && (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/60">
                <span>{o.order_number} · {o.store?.name}</span>
                <span className="text-[#39FF14]">{ORDER_STATUS_AR[o.status]}</span>
              </div>
              <div className="text-[11px] text-white/40 flex flex-wrap gap-3">
                <span>الإجمالي {formatMoney(o.total_amount, o.currency)}</span>
                <span>العمولة {formatMoney(o.commission_amount, o.currency)} ({o.commission_rate}%)</span>
                <span>صافي التاجر {formatMoney(o.merchant_net, o.currency)}</span>
                <span>الدفع: {o.payment_status}</span>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Input value={refundAmount[o.id] || ''} onChange={(e) => setRefundAmount({ ...refundAmount, [o.id]: e.target.value })}
                  placeholder="مبلغ الاسترجاع" className="h-8 w-40 bg-white/[0.05] border-white/[0.08] text-white text-[11px]" />
                <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                  onClick={() => run('mp_admin_refund', { _order_id: o.id, _amount: Number(refundAmount[o.id] || 0), _reason: reason || 'admin_refund' }, 'تم تنفيذ الاسترجاع')}>
                  استرجاع
                </Button>
                {o.payment_status !== 'paid' && (
                  <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_mark_order_paid', { _order_id: o.id, _reference: 'admin_manual', _processor_fee: 0 }, 'تم تأكيد الدفع')}>
                    تأكيد الدفع
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'commission' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
            <p className="text-sm text-white font-bold">إضافة قاعدة عمولة</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={newRule.scope} onChange={(e) => setNewRule({ ...newRule, scope: e.target.value })} className="bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-2 text-xs text-white">
                <option value="default" className="bg-black">افتراضي</option>
                <option value="store" className="bg-black">متجر</option>
                <option value="category" className="bg-black">تصنيف</option>
              </select>
              {newRule.scope === 'store' && (
                <select value={newRule.store_id} onChange={(e) => setNewRule({ ...newRule, store_id: e.target.value })} className="bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-2 text-xs text-white">
                  <option value="" className="bg-black">اختر متجر</option>
                  {stores.map((s) => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                </select>
              )}
              {newRule.scope === 'category' && (
                <select value={newRule.category} onChange={(e) => setNewRule({ ...newRule, category: e.target.value })} className="bg-white/[0.05] border border-white/[0.08] h-10 rounded-xl px-2 text-xs text-white">
                  <option value="" className="bg-black">اختر تصنيف</option>
                  {MP_CATEGORIES.map((c) => <option key={c.id} value={c.id} className="bg-black">{c.ar}</option>)}
                </select>
              )}
              <Input value={newRule.rate} onChange={(e) => setNewRule({ ...newRule, rate: e.target.value })} placeholder="النسبة %" className="h-10 bg-white/[0.05] border-white/[0.08] text-white text-xs" />
              <Input value={newRule.priority} onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })} placeholder="الأولوية" className="h-10 bg-white/[0.05] border-white/[0.08] text-white text-xs" />
            </div>
            <Button size="sm" className="bg-[#39FF14] text-black rounded-xl"
              onClick={() => run('mp_admin_set_commission', {
                _scope: newRule.scope,
                _store_id: newRule.scope === 'store' ? newRule.store_id : null,
                _category: newRule.scope === 'category' ? newRule.category : null,
                _rate: Number(newRule.rate),
                _priority: Number(newRule.priority),
                _active: true,
              }, 'تم حفظ القاعدة')}>
              حفظ القاعدة
            </Button>
          </div>

          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex justify-between text-xs text-white/70">
                <span>{r.scope} {r.category ? `· ${categoryLabel(r.category)}` : ''} {r.store_id ? `· ${stores.find((s) => s.id === r.store_id)?.name || ''}` : ''}</span>
                <span className="text-[#39FF14]">{r.rate}% {r.is_active ? '' : '(معطلة)'}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-white font-bold">إعدادات السوق</p>
            {settings.map((s) => (
              <div key={s.key} className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
                <span className="text-xs text-white/60 flex-1">{s.key}</span>
                <Input defaultValue={JSON.stringify(s.value)} className="h-8 w-48 bg-white/[0.05] border-white/[0.08] text-white text-[11px]"
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    try {
                      const val = JSON.parse((e.target as HTMLInputElement).value);
                      run('mp_admin_set_setting', { _key: s.key, _value: val }, 'تم حفظ الإعداد');
                    } catch { toast({ title: 'قيمة JSON غير صحيحة', variant: 'destructive' }); }
                  }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'payouts' && (
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>{p.store?.name} · {p.destination}</span>
                <span className="text-[#39FF14]">{formatMoney(p.amount, p.currency)} · {PAYOUT_STATUS_AR[p.status]}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['approve', 'process', 'mark_paid', 'reject'].map((a) => (
                  <Button key={a} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_payout_action', { _payout_id: p.id, _action: a, _reference: null, _note: reason || null }, 'تم تحديث السحب')}>
                    {{ approve: 'موافقة', process: 'قيد المعالجة', mark_paid: 'تم الدفع', reject: 'رفض' }[a]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'disputes' && (
        <div className="space-y-2">
          {disputes.map((d) => (
            <div key={d.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>{d.order?.order_number} · {d.reason}</span>
                <span className="text-[#39FF14]">{d.status}</span>
              </div>
              <p className="text-[11px] text-white/50">{d.details}</p>
              <div className="flex gap-2 flex-wrap">
                {['under_review', 'resolve_buyer', 'resolve_seller', 'close'].map((a) => (
                  <Button key={a} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_dispute_action', { _dispute_id: d.id, _action: a, _text: reason || null }, 'تم تحديث النزاع')}>
                    {{ under_review: 'قيد المراجعة', resolve_buyer: 'لصالح المشتري', resolve_seller: 'لصالح البائع', close: 'إغلاق' }[a]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'reports' && (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>{r.target_type} · {r.reason}</span>
                <span className="text-[#39FF14]">{r.status}</span>
              </div>
              <p className="text-[11px] text-white/50">{r.details}</p>
              <div className="flex gap-2">
                {['reviewing', 'actioned', 'dismissed'].map((a) => (
                  <Button key={a} size="sm" variant="outline" className="h-8 text-[11px] rounded-lg border-white/15"
                    onClick={() => run('mp_admin_report_action', { _report_id: r.id, _status: a, _note: reason || null }, 'تم تحديث البلاغ')}>
                    {{ reviewing: 'قيد المراجعة', actioned: 'تم الإجراء', dismissed: 'تجاهل' }[a]}
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

export default VaultMarketplace;
