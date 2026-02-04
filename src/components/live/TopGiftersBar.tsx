import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Medal } from 'lucide-react';

interface Gifter {
  id: string;
  username: string;
  avatar?: string;
  amount: number;
  rank: number;
}

interface TopGiftersBarProps {
  gifters: Gifter[];
  onViewAll?: () => void;
}

const RANK_COLORS = {
  1: 'from-yellow-400 to-amber-500',
  2: 'from-gray-300 to-gray-400',
  3: 'from-amber-600 to-amber-700',
};

const RANK_ICONS = {
  1: <Crown className="w-3 h-3" />,
  2: <Medal className="w-3 h-3" />,
  3: <Medal className="w-3 h-3" />,
};

export const TopGiftersBar = ({ gifters, onViewAll }: TopGiftersBarProps) => {
  const topGifters = gifters.slice(0, 5);

  if (topGifters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      {/* Top 3 Medals */}
      <div className="flex -space-x-2">
        {topGifters.slice(0, 3).map((gifter, index) => (
          <motion.div
            key={gifter.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 400 }}
            className="relative"
          >
            <Avatar className={`w-8 h-8 ring-2 ring-black border border-gray-600`}>
              <AvatarImage src={gifter.avatar} />
              <AvatarFallback className={`bg-gradient-to-br ${RANK_COLORS[gifter.rank as keyof typeof RANK_COLORS] || 'from-gray-500 to-gray-600'} text-white text-xs`}>
                {gifter.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Rank Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br ${RANK_COLORS[gifter.rank as keyof typeof RANK_COLORS] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white shadow-lg`}
            >
              {RANK_ICONS[gifter.rank as keyof typeof RANK_ICONS] || (
                <span className="text-[8px] font-bold">{gifter.rank}</span>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Points Summary */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onViewAll}
        className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1"
      >
        <span className="text-yellow-400 text-xs font-bold">
          🏆 {topGifters[0]?.amount?.toLocaleString() || 0}
        </span>
      </motion.button>
    </motion.div>
  );
};
