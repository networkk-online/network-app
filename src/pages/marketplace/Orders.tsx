import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney, ORDER_STATUS_AR } from '@/lib/marketplace';
import { PAYMENT_STATUS_AR, startPayment } from '@/lib/payments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Package, Star, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


const Orders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<any>(null);
  const [disputeText, setDisputeText] = useState('');
  const [review, setReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate('/login'); return; }
    const { data } = await supabase
      .from('marketplace_orders')
      .select('*, store:marketplace_stores(id,name,slug,logo_url), items:marketplace_order_items(*)')
      .eq('buyer_id', u.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc('mp_cancel_order', { _order_id: id, _reason: null });
    if (error) toast({ title: 'تعذر الإلغاء', description: error.message, variant: 'destructive' });
    else { toast({ title: 'تم إلغاء الطلب' }); load(); }
  };

  const openDispute = async () => {
    const { error } = await supabase.rpc('mp_open_dispute', { _order_id: dispute.id, _reason: 'buyer_dispute', _details: disputeText });
    if (error) toast({ title: 'تعذر فتح النزاع', description: error.message, variant: 'destructive' });
    else { toast({ title: 'تم فتح النزاع' }); setDispute(null); setDisputeText(''); load(); }
  };

  const submitReview = async () => {
    const { error } = await supabase.rpc('mp_submit_review', {
      _order_id: review.order.id, _product_id: review.item.product_id, _rating: rating, _body: reviewText, _images: [],
    });
    if (error) toast({ title: 'تعذر إرسال التقييم', description: error.message, variant: 'destructive' });
    else { toast({ title: 'شكراً لتقييمك' }); setReview(null); setReviewText(''); }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-28" dir="rtl">
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] pt-[env(safe-area-inset-top)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="text-base font-bold">طلباتي</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {loading && <p className="text-center text-white/40 text-sm py-12">جاري التحميل...</p>}
        {!loading && orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Package className="w-12 h-12 mx-auto text-white/15" />
            <p className="text-white/50 text-sm">لا توجد طلبات بعد</p>
            <Button onClick={() => navigate('/marketplace')} className="bg-primary text-black rounded-xl">تصفح السوق</Button>
          </div>
        )}

        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
              <span className="text-xs text-white/50">{o.order_number}</span>
              <span className="text-[11px] px-2 py-1 rounded-full bg-primary/15 text-primary">{ORDER_STATUS_AR[o.status] || o.status}</span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-white/50">المتجر: {o.store?.name}</p>
              {(o.items || []).map((it: any) => (
                <div key={it.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/[0.05] shrink-0">
                    {it.product_image && <img src={it.product_image} alt="" loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{it.product_name}</p>
                    <p className="text-[11px] text-white/40">{it.quantity} × {formatMoney(it.unit_price, o.currency)}</p>
                  </div>
                  {['delivered', 'completed'].includes(o.status) && it.product_id && (
                    <button onClick={() => { setReview({ order: o, item: it }); setRating(5); }} className="text-[11px] text-primary flex items-center gap-1 min-h-[44px]">
                      <Star className="w-3.5 h-3.5" /> تقييم
                    </button>
                  )}
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06] space-y-1 text-xs text-white/50">
                <div className="flex justify-between"><span>المجموع الفرعي</span><span>{formatMoney(o.subtotal, o.currency)}</span></div>
                <div className="flex justify-between"><span>الشحن</span><span>{formatMoney(o.shipping_amount, o.currency)}</span></div>
                <div className="flex justify-between text-white font-bold"><span>الإجمالي</span><span className="text-primary">{formatMoney(o.total_amount, o.currency)}</span></div>
                {o.tracking_number && <div className="flex justify-between"><span>رقم التتبع</span><span>{o.tracking_number}</span></div>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'payment_pending', 'confirmed'].includes(o.status) && o.payment_status !== 'paid' && (
                  <Button variant="outline" size="sm" className="rounded-xl border-white/15" onClick={() => cancel(o.id)}>إلغاء الطلب</Button>
                )}
                {['paid', 'shipped', 'delivered', 'completed'].includes(o.status) && o.dispute_status === 'none' && (
                  <Button variant="outline" size="sm" className="rounded-xl border-white/15" onClick={() => setDispute(o)}>فتح نزاع</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      <Dialog open={!!dispute} onOpenChange={(v) => !v && setDispute(null)}>
        <DialogContent className="bg-black border-white/10" dir="rtl">
          <DialogHeader><DialogTitle>فتح نزاع</DialogTitle></DialogHeader>
          <Textarea value={disputeText} onChange={(e) => setDisputeText(e.target.value)} placeholder="اشرح المشكلة" className="bg-white/[0.05] border-white/[0.08]" />
          <DialogFooter><Button onClick={openDispute} className="bg-primary text-black">إرسال</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!review} onOpenChange={(v) => !v && setReview(null)}>
        <DialogContent className="bg-black border-white/10" dir="rtl">
          <DialogHeader><DialogTitle>تقييم المنتج</DialogTitle></DialogHeader>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="p-1">
                <Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
              </button>
            ))}
          </div>
          <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="اكتب رأيك" className="bg-white/[0.05] border-white/[0.08]" />
          <DialogFooter><Button onClick={submitReview} className="bg-primary text-black">إرسال التقييم</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
