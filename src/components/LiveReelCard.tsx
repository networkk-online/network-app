import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Heart, MessageCircle, Users, Eye, Volume2, VolumeX } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar: string;
  streamerVerified?: boolean;
  viewerCount: number;
  title?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  startedAt: string;
  topGifters?: { name: string; avatar: string }[];
  recentComments?: { username: string; message: string }[];
}

interface LiveReelCardProps {
  stream: LiveStream;
  onEnterLive: (streamId: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export const LiveReelCard = ({ 
  stream, 
  onEnterLive,
  isMuted = false,
  onToggleMute
}: LiveReelCardProps) => {
  const [flyingHearts, setFlyingHearts] = useState<number[]>([]);
  const [heartId, setHeartId] = useState(0);

  // Simulate flying hearts for preview
  useEffect(() => {
    if (!stream.isActive) return;
    
    const interval = setInterval(() => {
      setHeartId(prev => prev + 1);
      setFlyingHearts(prev => [...prev, heartId].slice(-5));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [stream.isActive, heartId]);

  const formatViewers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (startedAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}`;
    return `${mins}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative w-full h-full bg-black"
      onClick={() => onEnterLive(stream.id)}
    >
      {/* Background with blur effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
        style={{ backgroundImage: stream.thumbnailUrl ? `url(${stream.thumbnailUrl})` : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      {/* LIVE Badge - Glowing Red */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-20 left-4 z-20"
      >
        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/50">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Radio className="w-4 h-4 text-white" />
          </motion.div>
          <span className="text-white font-bold text-sm">LIVE</span>
        </div>
      </motion.div>

      {/* Viewer Count */}
      <div className="absolute top-20 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <Eye className="w-4 h-4 text-white" />
        <span className="text-white font-semibold text-sm">
          {formatViewers(stream.viewerCount)}
        </span>
      </div>

      {/* Duration */}
      <div className="absolute top-20 right-24 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1.5 rounded-full">
        <span className="text-white text-xs font-mono">
          {formatDuration(stream.startedAt)}
        </span>
      </div>

      {/* Flying Hearts Animation */}
      <div className="absolute right-6 bottom-48 z-20 pointer-events-none">
        <AnimatePresence>
          {flyingHearts.map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
              animate={{ 
                opacity: 0, 
                y: -150, 
                x: Math.random() * 40 - 20,
                scale: 1 + Math.random() * 0.5
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute bottom-0 right-0"
            >
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Comments Preview - Bottom Left */}
      <div className="absolute bottom-32 left-4 right-20 z-20 space-y-2">
        {stream.recentComments?.slice(0, 3).map((comment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-2xl inline-block mr-auto"
          >
            <span className="text-white/80 text-sm">
              <span className="font-semibold text-white">{comment.username}</span>
              {' '}
              {comment.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Streamer Info */}
      <div className="absolute bottom-20 left-4 right-20 z-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-red-500 ring-2 ring-red-500/30">
              <AvatarImage src={stream.streamerAvatar} />
              <AvatarFallback className="bg-primary text-white">
                {stream.streamerName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black"
            />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-lg drop-shadow-lg">
              {stream.streamerName}
            </p>
            {stream.title && (
              <p className="text-white/80 text-sm truncate">{stream.title}</p>
            )}
          </div>
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg px-6 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onEnterLive(stream.id);
            }}
          >
            مشاهدة
          </Button>
        </div>
      </div>

      {/* Top Gifters */}
      {stream.topGifters && stream.topGifters.length > 0 && (
        <div className="absolute top-32 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-yellow-400 text-xs font-semibold">🏆 Top</span>
            </div>
            <div className="flex -space-x-2">
              {stream.topGifters.slice(0, 3).map((gifter, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-black">
                  <AvatarImage src={gifter.avatar} />
                  <AvatarFallback className="bg-yellow-500 text-white text-xs">
                    {gifter.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mute Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute?.();
        }}
        className="absolute bottom-24 left-4 z-30 p-2 bg-black/50 rounded-full"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Side Actions */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-6">
        <button className="flex flex-col items-center gap-1">
          <Heart className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
          <span className="text-xs text-white font-semibold drop-shadow-lg">
            {formatViewers(stream.viewerCount * 5)}
          </span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
          <span className="text-xs text-white font-semibold drop-shadow-lg">دردشة</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <Users className="w-7 h-7 text-white drop-shadow-lg" strokeWidth={2.5} />
          <span className="text-xs text-white font-semibold drop-shadow-lg">
            {formatViewers(stream.viewerCount)}
          </span>
        </button>
      </div>

      {/* Tap to Enter Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl"
        >
          <span className="text-white font-semibold">اضغط للانضمام للبث 🔴</span>
        </motion.div>
      </div>
    </motion.div>
  );
};
