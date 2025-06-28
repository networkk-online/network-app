
import { Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WalletCardProps {
  balance: number;
  todayEarnings: number;
  totalPosts: number;
}

const WalletCard = ({ balance, todayEarnings, totalPosts }: WalletCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-gray-900 to-black border-green-500 border-2 neon-glow mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold neon-text">Creator Wallet</h3>
          </div>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">${balance.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Total Balance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">+${todayEarnings.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalPosts}</p>
            <p className="text-xs text-gray-400">Posts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
