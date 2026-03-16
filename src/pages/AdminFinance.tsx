import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Search, CheckCircle, XCircle, Eye, ArrowDownToLine, ArrowUpFromLine, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

interface FinanceRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  receipt_url?: string;
  reject_reason?: string;
  payment_method?: string;
  phone_number?: string;
  card_number?: string;
  card_holder?: string;
  account_details?: any;
  profile?: { full_name: string | null; username: string | null };
}

const formatAmount = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
};

const getMethodLabel = (method?: string) => {
  const map: Record<string, string> = {
    zaincash: 'ZainCash', qicard: 'QiCard', visa: 'Visa',
    mastercard: 'MasterCard', paypal: 'PayPal', bank: 'تحويل بنكي', bitcoin: 'Bitcoin'
  };
  return method ? map[method] || method : '—';
};

const statusBadge = (status: string) => {
  if (status === 'approved') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">موافق عليه</Badge>;
  if (status === 'rejected') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">مرفوض</Badge>;
  return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse">قيد الانتظار</Badge>;
};

const AdminFinance = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<FinanceRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<FinanceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; type: 'deposit' | 'withdrawal' }>({ open: false, id: '', type: 'deposit' });
  const [rejectReason, setRejectReason] = useState('');
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; item: FinanceRequest | null }>({ open: false, item: null });
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [securityPassword, setSecurityPassword] = useState('');

  useEffect(() => {
    if (passwordVerified) {
      fetchData();
    }
  }, [passwordVerified]);

  const fetchData = async () => {
    setLoading(true);
    const [depositsRes, withdrawalsRes] = await Promise.all([
      supabase.from('deposits').select('*').order('created_at', { ascending: false }),
      supabase.from('withdrawals' as any).select('*').order('created_at', { ascending: false })
    ]);

    const depositsData = (depositsRes.data || []) as any[];
    const withdrawalsData = (withdrawalsRes.data || []) as any[];

    const allUserIds = [
      ...depositsData.map((d: any) => d.user_id),
      ...withdrawalsData.map((w: any) => w.user_id)
    ].filter((v, i, a) => a.indexOf(v) === i);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', allUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setDeposits(depositsData.map((d: any) => ({
      ...d,
      profile: profileMap.get(d.user_id) || { full_name: null, username: null }
    })));

    setWithdrawals(withdrawalsData.map((w: any) => ({
      ...w,
      profile: profileMap.get(w.user_id) || { full_name: null, username: null }
    })));

    setLoading(false);
  };

  const handleApprove = async (id: string, type: 'deposit' | 'withdrawal') => {
    const table = type === 'deposit' ? 'deposits' : 'withdrawals';
    const { error } = await supabase.from(table).update({
      status: 'approved',
      reviewed_at: new Date().toISOString()
    }).eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء الموافقة');
      return;
    }
    toast.success('تمت الموافقة بنجاح ✅');
    fetchData();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    const table = rejectDialog.type === 'deposit' ? 'deposits' : 'withdrawals';
    const { error } = await supabase.from(table).update({
      status: 'rejected',
      reject_reason: rejectReason,
      reviewed_at: new Date().toISOString()
    }).eq('id', rejectDialog.id);

    if (error) {
      toast.error('حدث خطأ أثناء الرفض');
      return;
    }
    toast.success('تم رفض الطلب');
    setRejectDialog({ open: false, id: '', type: 'deposit' });
    setRejectReason('');
    fetchData();
  };

  const filterData = (data: FinanceRequest[]) => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter(item =>
      item.profile?.full_name?.toLowerCase().includes(s) ||
      item.profile?.username?.toLowerCase().includes(s) ||
      (item.payment_method && getMethodLabel(item.payment_method).toLowerCase().includes(s))
    );
  };

  const handlePasswordCheck = () => {
    if (securityPassword === 'network2025admin') {
      setPasswordVerified(true);
    } else {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  if (!passwordVerified) {
    return (
      <AdminAuthGuard>
        {() => (
          <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
            <div className="bg-card border border-border/30 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-4">
              <div className="text-center space-y-2">
                <div className="bg-primary/20 p-3 rounded-xl w-fit mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">تحقق أمني</h2>
                <p className="text-sm text-muted-foreground">أدخل كلمة المرور الثانوية للوصول</p>
              </div>
              <Input
                type="password"
                value={securityPassword}
                onChange={e => setSecurityPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordCheck()}
                placeholder="كلمة المرور الأمنية"
                className="bg-secondary border-border text-foreground text-center"
              />
              <Button onClick={handlePasswordCheck} className="w-full bg-primary hover:bg-primary/80">
                دخول
              </Button>
            </div>
          </div>
        )}
      </AdminAuthGuard>
    );
  }

  const renderTable = (data: FinanceRequest[], type: 'deposit' | 'withdrawal') => {
    const filtered = filterData(data);
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/20 hover:bg-transparent">
              <TableHead className="text-muted-foreground">المستخدم</TableHead>
              <TableHead className="text-muted-foreground">المبلغ</TableHead>
              {type === 'withdrawal' && <TableHead className="text-muted-foreground">طريقة الدفع</TableHead>}
              <TableHead className="text-muted-foreground">الحالة</TableHead>
              <TableHead className="text-muted-foreground">التاريخ</TableHead>
              <TableHead className="text-muted-foreground">التفاصيل</TableHead>
              <TableHead className="text-muted-foreground">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={type === 'withdrawal' ? 7 : 6} className="text-center text-muted-foreground py-12">
                  لا توجد طلبات
                </TableCell>
              </TableRow>
            )}
            {filtered.map(item => (
              <TableRow key={item.id} className="border-border/10 hover:bg-secondary/50">
                <TableCell>
                  <div>
                    <p className="text-foreground font-medium text-sm">{item.profile?.full_name || 'غير معروف'}</p>
                    <p className="text-muted-foreground text-xs">@{item.profile?.username || '—'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-primary font-bold">{formatAmount(Number(item.amount))}</TableCell>
                {type === 'withdrawal' && (
                  <TableCell>
                    <Badge variant="outline" className="border-border/30 text-foreground text-xs">
                      {getMethodLabel(item.payment_method)}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>{statusBadge(item.status)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(item.created_at).toLocaleDateString('ar-IQ')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailDialog({ open: true, item })}
                    className="text-primary hover:text-primary/80"
                  >
                    <Eye className="h-4 w-4 ml-1" /> عرض
                  </Button>
                </TableCell>
                <TableCell>
                  {item.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id, type)}
                        className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                      >
                        <CheckCircle className="h-3 w-3 ml-1" /> موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectDialog({ open: true, id: item.id, type })}
                        className="h-8 px-3"
                      >
                        <XCircle className="h-3 w-3 ml-1" /> رفض
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">تمت المراجعة</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AdminAuthGuard>
      {() => (
        <div className="min-h-screen bg-background text-foreground" dir="rtl">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border/30">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-green-400 p-2 rounded-xl shadow-lg shadow-primary/30">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">لوحة المالية</h1>
                  <p className="text-xs text-muted-foreground">إدارة الإيداعات والسحوبات</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin-control')} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 ml-1" /> رجوع
              </Button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو طريقة الدفع..."
                className="bg-secondary border-border/20 text-foreground pr-10"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="deposits" className="space-y-4">
              <TabsList className="bg-secondary border border-border/20 p-1 gap-1">
                <TabsTrigger value="deposits" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <ArrowDownToLine className="h-4 w-4" /> طلبات الإيداع
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs mr-1">
                    {deposits.filter(d => d.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <ArrowUpFromLine className="h-4 w-4" /> طلبات السحب
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs mr-1">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposits">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
                ) : renderTable(deposits, 'deposit')}
              </TabsContent>

              <TabsContent value="withdrawals">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
                ) : renderTable(withdrawals, 'withdrawal')}
              </TabsContent>
            </Tabs>
          </main>

          {/* Reject Dialog */}
          <Dialog open={rejectDialog.open} onOpenChange={open => !open && setRejectDialog({ ...rejectDialog, open: false })}>
            <DialogContent className="bg-card border-border/30 text-foreground" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-destructive">رفض الطلب</DialogTitle>
              </DialogHeader>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض..."
                className="bg-secondary border-border/20 text-foreground min-h-[100px]"
              />
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setRejectDialog({ ...rejectDialog, open: false })}>إلغاء</Button>
                <Button variant="destructive" onClick={handleReject}>تأكيد الرفض</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Detail Dialog */}
          <Dialog open={detailDialog.open} onOpenChange={open => !open && setDetailDialog({ open: false, item: null })}>
            <DialogContent className="bg-card border-border/30 text-foreground" dir="rtl">
              <DialogHeader>
                <DialogTitle>تفاصيل الطلب</DialogTitle>
              </DialogHeader>
              {detailDialog.item && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">الاسم:</span><span>{detailDialog.item.profile?.full_name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">المستخدم:</span><span>@{detailDialog.item.profile?.username || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">المبلغ:</span><span className="text-primary font-bold">{formatAmount(Number(detailDialog.item.amount))}</span></div>
                  {detailDialog.item.payment_method && (
                    <div className="flex justify-between"><span className="text-muted-foreground">طريقة الدفع:</span><span>{getMethodLabel(detailDialog.item.payment_method)}</span></div>
                  )}
                  {detailDialog.item.phone_number && (
                    <div className="flex justify-between"><span className="text-muted-foreground">رقم الهاتف:</span><span dir="ltr">{detailDialog.item.phone_number}</span></div>
                  )}
                  {detailDialog.item.card_number && (
                    <div className="flex justify-between"><span className="text-muted-foreground">رقم البطاقة:</span><span dir="ltr">{detailDialog.item.card_number}</span></div>
                  )}
                  {detailDialog.item.card_holder && (
                    <div className="flex justify-between"><span className="text-muted-foreground">حامل البطاقة:</span><span>{detailDialog.item.card_holder}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">الحالة:</span>{statusBadge(detailDialog.item.status)}</div>
                  {detailDialog.item.reject_reason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-destructive text-xs font-medium">سبب الرفض:</p>
                      <p className="text-foreground text-sm mt-1">{detailDialog.item.reject_reason}</p>
                    </div>
                  )}
                  {detailDialog.item.receipt_url && (
                    <div>
                      <p className="text-muted-foreground mb-2">إيصال التحويل:</p>
                      <img src={detailDialog.item.receipt_url} alt="receipt" className="rounded-lg max-h-64 w-full object-contain bg-secondary" />
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </AdminAuthGuard>
  );
};

export default AdminFinance;
