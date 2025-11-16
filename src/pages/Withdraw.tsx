import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, CreditCard, Building2, DollarSign, Bitcoin, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState({
    email: '',
    accountNumber: '',
    routingNumber: '',
    walletAddress: '',
    phoneNumber: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    qiCardNumber: '',
    zainCashNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);

  const btcPrice = 43000;
  const minimumWithdraw = 50.00;

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "سجل دخولك لعرض محفظتك",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Get user finances
      let { data: financeData, error: financeError } = await supabase
        .from('user_finances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no finance record exists, create one
      if (!financeData && !financeError) {
        const { data: newFinance, error: insertError } = await supabase
          .from('user_finances')
          .insert({
            user_id: user.id,
            balance: 0,
            total_earnings: 0,
            total_withdrawn: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating finance record:', insertError);
        } else {
          financeData = newFinance;
        }
      }

      if (financeError && financeError.code !== 'PGRST116') {
        throw financeError;
      }

      setWalletBalance(financeData ? Number(financeData.balance) || 0 : 0);
      setTotalEarnings(financeData ? Number(financeData.total_earnings) || 0 : 0);
      setTotalWithdrawn(financeData ? Number(financeData.total_withdrawn) || 0 : 0);

    } catch (error: any) {
      console.error('Error loading wallet:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المحفظة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const withdrawMethods = [
    {
      id: 'zaincash',
      name: 'زين كاش',
      icon: Wallet,
      fee: '1000 IQD',
      processingTime: 'فوري - 30 دقيقة',
      minAmount: 10,
      currency: 'USD'
    },
    {
      id: 'qicard',
      name: 'كي كارد',
      icon: CreditCard,
      fee: '500 IQD',
      processingTime: 'فوري - 1 ساعة',
      minAmount: 10,
      currency: 'USD'
    },
    {
      id: 'visa',
      name: 'فيزا كارد',
      icon: CreditCard,
      fee: '3%',
      processingTime: '1-3 أيام عمل',
      minAmount: 25,
      currency: 'USD'
    },
    {
      id: 'mastercard',
      name: 'ماستر كارد',
      icon: CreditCard,
      fee: '3%',
      processingTime: '1-3 أيام عمل',
      minAmount: 25,
      currency: 'USD'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: CreditCard,
      fee: '2.9% + $0.30',
      processingTime: '1-2 أيام عمل',
      minAmount: 50,
      currency: 'USD'
    },
    {
      id: 'bank',
      name: 'تحويل بنكي',
      icon: Building2,
      fee: '$25',
      processingTime: '3-5 أيام عمل', 
      minAmount: 100,
      currency: 'USD'
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      icon: Bitcoin,
      fee: '1%',
      processingTime: '30 دقيقة - ساعة',
      minAmount: 25,
      currency: 'BTC'
    }
  ];

  const handleWithdraw = () => {
    if (!selectedMethod || !amount) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طريقة السحب وإدخال المبلغ",
        variant: "destructive"
      });
      return;
    }

    const selectedMethodData = withdrawMethods.find(m => m.id === selectedMethod);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < selectedMethodData!.minAmount) {
      toast({
        title: "خطأ",
        description: `الحد الأدنى للسحب هو $${selectedMethodData!.minAmount}`,
        variant: "destructive"
      });
      return;
    }

    if (withdrawAmount > walletBalance) {
      toast({
        title: "خطأ", 
        description: "المبلغ أكبر من الرصيد المتاح",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "تم إرسال طلب السحب",
      description: `سيتم معالجة طلب سحب $${amount} خلال ${selectedMethodData!.processingTime}`,
    });

    // Reset form
    setAmount('');
    setSelectedMethod('');
    setAccountDetails({
      email: '',
      accountNumber: '',
      routingNumber: '',
      walletAddress: '',
      phoneNumber: '',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      qiCardNumber: '',
      zainCashNumber: ''
    });
  };

  const calculateFee = (method: string, amount: number) => {
    const methodData = withdrawMethods.find(m => m.id === method);
    if (!methodData) return 0;

    switch (method) {
      case 'zaincash':
        return 1000 / 1500; // تحويل 1000 دينار إلى دولار تقريبي
      case 'qicard':
        return 500 / 1500; // تحويل 500 دينار إلى دولار تقريبي
      case 'visa':
      case 'mastercard':
        return amount * 0.03;
      case 'paypal':
        return (amount * 0.029) + 0.30;
      case 'bank':
        return 25;
      case 'bitcoin':
        return amount * 0.01;
      default:
        return 0;
    }
  };

  const renderMethodDetails = () => {
    switch (selectedMethod) {
      case 'zaincash':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="zainCashNumber" className="text-white">رقم زين كاش</Label>
              <Input
                id="zainCashNumber"
                type="tel"
                value={accountDetails.zainCashNumber}
                onChange={(e) => setAccountDetails({...accountDetails, zainCashNumber: e.target.value})}
                placeholder="07XXXXXXXXX"
                className="bg-gray-800 border-gray-600 text-white"
                dir="ltr"
              />
            </div>
          </div>
        );
      case 'qicard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="qiCardNumber" className="text-white">رقم كي كارد</Label>
              <Input
                id="qiCardNumber"
                type="tel"
                value={accountDetails.qiCardNumber}
                onChange={(e) => setAccountDetails({...accountDetails, qiCardNumber: e.target.value})}
                placeholder="07XXXXXXXXX"
                className="bg-gray-800 border-gray-600 text-white"
                dir="ltr"
              />
            </div>
          </div>
        );
      case 'visa':
      case 'mastercard':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber" className="text-white">رقم البطاقة</Label>
              <Input
                id="cardNumber"
                type="text"
                value={accountDetails.cardNumber}
                onChange={(e) => setAccountDetails({...accountDetails, cardNumber: e.target.value})}
                placeholder="1234 5678 9012 3456"
                className="bg-gray-800 border-gray-600 text-white font-mono"
                dir="ltr"
                maxLength={19}
              />
            </div>
            <div>
              <Label htmlFor="cardHolder" className="text-white">اسم حامل البطاقة</Label>
              <Input
                id="cardHolder"
                type="text"
                value={accountDetails.cardHolder}
                onChange={(e) => setAccountDetails({...accountDetails, cardHolder: e.target.value})}
                placeholder="CARDHOLDER NAME"
                className="bg-gray-800 border-gray-600 text-white uppercase"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate" className="text-white">تاريخ الانتهاء</Label>
              <Input
                id="expiryDate"
                type="text"
                value={accountDetails.expiryDate}
                onChange={(e) => setAccountDetails({...accountDetails, expiryDate: e.target.value})}
                placeholder="MM/YY"
                className="bg-gray-800 border-gray-600 text-white font-mono"
                dir="ltr"
                maxLength={5}
              />
            </div>
          </div>
        );
      case 'paypal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">بريد PayPal الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={accountDetails.email}
                onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                placeholder="example@paypal.com"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountNumber" className="text-white">رقم الحساب</Label>
              <Input
                id="accountNumber"
                value={accountDetails.accountNumber}
                onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                placeholder="1234567890"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="routingNumber" className="text-white">رقم التوجيه</Label>
              <Input
                id="routingNumber"
                value={accountDetails.routingNumber}
                onChange={(e) => setAccountDetails({...accountDetails, routingNumber: e.target.value})}
                placeholder="123456789"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
        );
      case 'bitcoin':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletAddress" className="text-white">عنوان محفظة Bitcoin</Label>
              <Input
                id="walletAddress"
                value={accountDetails.walletAddress}
                onChange={(e) => setAccountDetails({...accountDetails, walletAddress: e.target.value})}
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              سحب الأموال
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="text-gray-400 text-lg">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            سحب الأموال
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" />
                ملخص المحفظة
              </CardTitle>
              <CardDescription>
                عرض تفصيلي لرصيدك وأرباحك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Earnings */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">إجمالي الأرباح</span>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  ${totalEarnings.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Bitcoin className="w-3 h-3" />
                  {(totalEarnings / btcPrice).toFixed(6)} BTC
                </p>
              </div>

              <Separator />

              {/* Wallet Balance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-3 bg-gray-800/50 rounded-lg px-4">
                  <span className="font-medium text-foreground">الرصيد المتاح للسحب</span>
                  <span className="text-2xl font-bold text-primary">
                    ${walletBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-4 text-sm text-muted-foreground">
                  <span>إجمالي الأرباح</span>
                  <span>${totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-4 text-sm text-muted-foreground">
                  <span>إجمالي المسحوب</span>
                  <span>${totalWithdrawn.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>الحد الأدنى للسحب</span>
                  <span className="text-foreground font-medium">${minimumWithdraw}</span>
                </div>
                <div className="flex justify-between">
                  <span>العملة</span>
                  <span className="text-foreground font-medium">USD</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          <Card className="bg-gray-900 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-sm">عمليات السحب الأخيرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { amount: 500, method: 'PayPal', status: 'مكتمل', date: '2024-01-15' },
                { amount: 250, method: 'Bitcoin', status: 'قيد المعالجة', date: '2024-01-10' }
              ].map((withdrawal, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">${withdrawal.amount}</p>
                    <p className="text-xs text-gray-400">{withdrawal.method} • {withdrawal.date}</p>
                  </div>
                  <Badge 
                    variant={withdrawal.status === 'مكتمل' ? 'default' : 'secondary'}
                    className={withdrawal.status === 'مكتمل' ? 'bg-green-600' : 'bg-yellow-600'}
                  >
                    {withdrawal.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Form */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">طلب سحب جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Withdraw Methods */}
              <div>
                <Label className="text-white mb-3 block">اختر طريقة السحب</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {withdrawMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          selectedMethod === method.id
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Icon className={`w-8 h-8 ${
                            selectedMethod === method.id ? 'text-green-400' : 'text-gray-400'
                          }`} />
                          <span className="text-white font-medium">{method.name}</span>
                          <span className="text-xs text-gray-400">رسوم: {method.fee}</span>
                          <span className="text-xs text-gray-500">{method.processingTime}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              {selectedMethod && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount" className="text-white">مبلغ السحب</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-gray-800 border-gray-600 text-white pl-10"
                      />
                    </div>
                    {amount && (
                      <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">المبلغ</span>
                          <span className="text-white">${parseFloat(amount || '0').toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">الرسوم</span>
                          <span className="text-red-400">-${calculateFee(selectedMethod, parseFloat(amount || '0')).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t border-gray-700 pt-2 mt-2">
                          <span className="text-white">المبلغ النهائي</span>
                          <span className="text-green-400">${(parseFloat(amount || '0') - calculateFee(selectedMethod, parseFloat(amount || '0'))).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Account Details */}
                  {renderMethodDetails()}

                  {/* Submit Button */}
                  <Button
                    onClick={handleWithdraw}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3"
                    disabled={!selectedMethod || !amount}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    تأكيد طلب السحب
                  </Button>

                  {/* Warning */}
                  <div className="flex items-start space-x-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium">تنبيه مهم:</p>
                      <p>تأكد من صحة بيانات الحساب المدخلة. لا يمكن التراجع عن العملية بعد المعالجة.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;