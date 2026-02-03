import { motion } from 'framer-motion';
import { X, Image, Video, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content?: string;
    mediaType?: 'image' | 'video' | 'voice' | 'document' | 'sticker' | 'gif';
    senderName: string;
    isOwn: boolean;
  };
  onCancelReply: () => void;
}

export const ReplyPreview = ({ replyTo, onCancelReply }: ReplyPreviewProps) => {
  const getMediaIcon = () => {
    switch (replyTo.mediaType) {
      case 'image':
        return <Image className="w-4 h-4 text-white/60" />;
      case 'video':
        return <Video className="w-4 h-4 text-white/60" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-white/60" />;
      default:
        return null;
    }
  };

  const getPreviewText = () => {
    if (replyTo.content) return replyTo.content;
    switch (replyTo.mediaType) {
      case 'image':
        return 'صورة';
      case 'video':
        return 'فيديو';
      case 'voice':
        return 'رسالة صوتية';
      default:
        return 'رسالة';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: 10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: 10 }}
      className="mx-4 mb-2"
    >
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-2xl',
        'bg-[#1C1C1E] border-r-4',
        replyTo.isOwn 
          ? 'border-r-gradient-to-b from-[#833AB4] to-[#E1306C]' 
          : 'border-r-[#833AB4]'
      )}
      style={{
        borderRightColor: replyTo.isOwn ? '#833AB4' : '#666'
      }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#833AB4] mb-0.5">
            {replyTo.isOwn ? 'أنت' : replyTo.senderName}
          </p>
          <div className="flex items-center gap-2">
            {getMediaIcon()}
            <p className="text-sm text-white/70 truncate">
              {getPreviewText()}
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCancelReply}
          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>
    </motion.div>
  );
};
