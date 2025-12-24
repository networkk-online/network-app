
import { Wallet, TrendingUp, Bitcoin, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface WalletCardProps {
  balance: number;
  todayEarnings: number;
  totalPosts: number;
}

const WalletCard = ({ balance, todayEarnings, totalPosts }: WalletCardProps) => {
  // سعر البيتكوين التقريبي (يمكن تحديثه من API في المستقبل)
  const btcPrice = 43000; // $43,000 per Bitcoin
  const btcBalance = balance / btcPrice;
  const btcTodayEarnings = todayEarnings / btcPrice;

  return (
    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-gradient-to-r from-green-500 to-orange-500 shadow-2xl mb-6 overflow-hidden">
      <CardContent className="p-6 relative">
        {/* Background Bitcoin Pattern */}
        <div className="absolute top-0 right-0 opacity-5">
          <Bitcoin className="w-32 h-32 text-orange-400" />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-500 to-orange-500 p-2 rounded-full">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">
              محفظة المبدعين
            </h3>
          </div>
          <TrendingUp className="w-6 h-6 text-green-400 animate-pulse" />
        </div>
        
        {/* USD Section */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <span className="text-green-400 font-semibold text-sm">💵 بالدولار الأمريكي</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-gray-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
              <p className="text-xs text-gray-400">الرصيد الكلي</p>
            </div>
            <div className="text-center bg-gray-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">+${todayEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-400">اليوم</p>
            </div>
            <div className="text-center bg-gray-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{totalPosts}</p>
              <p className="text-xs text-gray-400">المنشورات</p>
            </div>
          </div>
        </div>

        {/* Bitcoin Section */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bitcoin className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm">بالبيتكوين</span>
            </div>
            <span className="text-xs text-gray-500">1 BTC = ${btcPrice.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-orange-900/20 rounded-lg p-3 border border-orange-500/30">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Bitcoin className="w-4 h-4 text-orange-400" />
                <p className="text-lg font-bold text-orange-400">{btcBalance.toFixed(6)}</p>
              </div>
              <p className="text-xs text-gray-400">الرصيد بالبيتكوين</p>
            </div>
            <div className="text-center bg-orange-900/20 rounded-lg p-3 border border-orange-500/30">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Bitcoin className="w-4 h-4 text-orange-400" />
                <p className="text-lg font-bold text-orange-400">+{btcTodayEarnings.toFixed(6)}</p>
              </div>
              <p className="text-xs text-gray-400">أرباح اليوم</p>
            </div>
          </div>
        </div>

        {/* Crypto Info */}
        <div className="mt-4 p-3 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 rounded-lg border border-orange-500/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">آخر تحديث للسعر</span>
            <span className="text-orange-400 font-medium">في الوقت الفعلي</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
