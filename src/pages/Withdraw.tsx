import { useState } from 'react';
import { ArrowLeft, Wallet, CreditCard, Building2, DollarSign, Bitcoin, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Withdraw = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState({
    email: '',
    accountNumber: '',
    routingNumber: '',
    walletAddress: ''
  });

  // Mock wallet data
  const walletBalance = 2847.50;
  const btcPrice = 43000;
  const availableBalance = 2500.00; // After fees
  const minimumWithdraw = 50.00;

  const withdrawMethods = [
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

    if (withdrawAmount > availableBalance) {
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
      walletAddress: ''
    });
  };

  const calculateFee = (method: string, amount: number) => {
    const methodData = withdrawMethods.find(m => m.id === method);
    if (!methodData) return 0;

    switch (method) {
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
          <Card className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-400">
                <Wallet className="w-5 h-5" />
                <span>ملخص المحفظة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-400">الرصيد الكلي</p>
                <p className="text-2xl font-bold text-green-400">${walletBalance.toFixed(2)}</p>
                <p className="text-xs text-orange-400 flex items-center justify-center space-x-1 mt-1">
                  <Bitcoin className="w-3 h-3" />
                  <span>{(walletBalance / btcPrice).toFixed(6)} BTC</span>
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <p className="text-sm text-gray-400">متاح للسحب</p>
                <p className="text-xl font-bold text-blue-400">${availableBalance.toFixed(2)}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">الحد الأدنى للسحب</span>
                  <span className="text-white">${minimumWithdraw}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">رسوم محتجزة</span>
                  <span className="text-yellow-400">${(walletBalance - availableBalance).toFixed(2)}</span>
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