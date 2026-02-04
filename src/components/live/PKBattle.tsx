import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Trophy, Flame } from 'lucide-react';

interface PKPlayer {
  id: string;
  username: string;
  avatar?: string;
  hypePoints: number;
  gifts: number;
  comments: number;
}

interface PKBattleProps {
  player1: PKPlayer;
  player2: PKPlayer;
  duration: number; // in seconds
  onEnd?: (winnerId: string) => void;
}

export const PKBattle = ({ player1, player2, duration, onEnd }: PKBattleProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isEnded, setIsEnded] = useState(false);

  const totalPoints = player1.hypePoints + player2.hypePoints;
  const player1Percent = totalPoints > 0 ? (player1.hypePoints / totalPoints) * 100 : 50;
  const player2Percent = 100 - player1Percent;

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsEnded(true);
      const winnerId = player1.hypePoints > player2.hypePoints ? player1.id : player2.id;
      onEnd?.(winnerId);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, player1.hypePoints, player2.hypePoints, onEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlayer1Winning = player1.hypePoints > player2.hypePoints;
  const isPlayer2Winning = player2.hypePoints > player1.hypePoints;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="absolute top-20 left-4 right-4 z-50"
    >
      {/* PK Header */}
      <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
        {/* Title & Timer */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Swords className="w-5 h-5 text-red-500" />
          <span className="text-white font-bold">PK Battle</span>
          <div className="px-3 py-1 bg-red-500 rounded-full">
            <span className="text-white font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between mb-3">
          {/* Player 1 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className={`w-12 h-12 border-2 ${isPlayer1Winning ? 'border-yellow-400' : 'border-white/30'}`}>
                <AvatarImage src={player1.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500">
                  {player1.username[0]}
                </AvatarFallback>
              </Avatar>
              {isPlayer1Winning && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                </motion.div>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{player1.username}</p>
              <p className="text-yellow-400 text-xs font-bold">{player1.hypePoints.toLocaleString()} نقطة</p>
            </div>
          </div>

          {/* VS Badge */}
          <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-full px-4 py-1">
            <span className="text-white font-bold text-sm">VS</span>
          </div>

          {/* Player 2 */}
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="relative">
              <Avatar className={`w-12 h-12 border-2 ${isPlayer2Winning ? 'border-yellow-400' : 'border-white/30'}`}>
                <AvatarImage src={player2.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-500">
                  {player2.username[0]}
                </AvatarFallback>
              </Avatar>
              {isPlayer2Winning && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-2 -left-2"
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                </motion.div>
              )}
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-sm">{player2.username}</p>
              <p className="text-yellow-400 text-xs font-bold">{player2.hypePoints.toLocaleString()} نقطة</p>
            </div>
          </div>
        </div>

        {/* Hype Meter */}
        <div className="relative h-6 rounded-full overflow-hidden bg-gray-800">
          {/* Player 1 Side */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: '50%' }}
            animate={{ width: `${player1Percent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="text-white font-bold text-xs drop-shadow-lg">
                {Math.round(player1Percent)}%
              </span>
            </div>
          </motion.div>

          {/* Player 2 Side */}
          <motion.div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-pink-500 to-red-400"
            initial={{ width: '50%' }}
            animate={{ width: `${player2Percent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <span className="text-white font-bold text-xs drop-shadow-lg">
                {Math.round(player2Percent)}%
              </span>
            </div>
          </motion.div>

          {/* Center divider */}
          <motion.div
            className="absolute top-0 h-full w-1 bg-white shadow-lg z-10"
            initial={{ left: '50%' }}
            animate={{ left: `${player1Percent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>

        {/* Stats */}
        <div className="flex justify-between mt-3 text-xs text-gray-400">
          <div className="flex gap-3">
            <span>💬 {player1.comments}</span>
            <span>🎁 {player1.gifts}</span>
          </div>
          <div className="flex gap-3">
            <span>🎁 {player2.gifts}</span>
            <span>💬 {player2.comments}</span>
          </div>
        </div>
      </div>

      {/* Winner Overlay */}
      {isEnded && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
            </motion.div>
            <p className="text-white font-bold text-lg">
              🎉 الفائز: {player1.hypePoints > player2.hypePoints ? player1.username : player2.username}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
