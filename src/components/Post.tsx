
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceMessage } from './VoiceMessage';
import { useToast } from '@/hooks/use-toast';

interface PostProps {
  id: string;
  username: string;
  userAvatar: string;
  image?: string;
  caption: string;
  likes: number;
  timeAgo: string;
  walletEarnings: number;
  voiceUrl?: string;
  voiceDuration?: number;
}

const Post = ({ username, userAvatar, image, caption, likes, timeAgo, walletEarnings, voiceUrl, voiceDuration }: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleVoiceComment = (audioBlob: Blob, duration: number) => {
    setShowVoiceRecorder(false);
    toast({
      title: "تم إضافة التعليق الصوتي",
      description: `المدة: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
    });
  };

  return (
    <div className="bg-black border border-gray-800 rounded-lg mb-6 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img 
            src={userAvatar} 
            alt={username}
            className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
          />
          <div>
            <p className="font-semibold neon-text">{username}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{timeAgo}</span>
              <span>•</span>
              <span className="text-green-400">+${walletEarnings.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1">
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </Button>
      </div>

      {/* Post Content */}
      {voiceUrl ? (
        <div className="p-6 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <VoiceMessage 
            audioUrl={voiceUrl}
            duration={voiceDuration || 0}
            isOwn={false}
          />
        </div>
      ) : image ? (
        <div className="relative">
          <img 
            src={image} 
            alt="Post content"
            className="w-full h-96 object-cover"
          />
        </div>
      ) : null}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent group"
              onClick={handleLike}
            >
              <Heart 
                className={`w-6 h-6 transition-all duration-300 ${
                  isLiked 
                    ? 'fill-red-500 text-red-500 animate-pulse scale-110' 
                    : 'text-white hover:text-red-400 group-hover:scale-110'
                }`} 
              />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent group">
              <MessageCircle className="w-6 h-6 hover:text-blue-400 transition-all duration-200 group-hover:scale-110" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent group">
              <Send className="w-6 h-6 hover:text-green-400 transition-all duration-200 group-hover:scale-110" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent group">
            <Bookmark className="w-6 h-6 hover:text-yellow-400 transition-all duration-200 group-hover:scale-110" />
          </Button>
        </div>

        {/* Enhanced Likes Count */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex -space-x-1">
            {/* Sample avatar stack for recent likes */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-400 to-red-400 border border-white"></div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border border-white"></div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-teal-400 border border-white"></div>
          </div>
          <p className="font-semibold text-white">
            <span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
              {likeCount.toLocaleString()}
            </span>
            <span className="text-gray-300 ml-1">إعجاب</span>
          </p>
        </div>

        {/* Caption */}
        <div className="mb-2">
          <span className="font-semibold neon-text mr-2">{username}</span>
          <span className="text-white">{caption}</span>
        </div>

        {/* View Comments */}
        <button className="text-gray-400 text-sm hover:text-gray-300 mb-3">
          View all comments
        </button>

        {/* Add Comment */}
        <div className="pt-3 border-t border-gray-800">
          {showVoiceRecorder ? (
            <VoiceRecorder 
              onRecordingComplete={handleVoiceComment}
              maxDuration={60}
            />
          ) : (
            <div className="flex items-center space-x-3">
              <input 
                type="text" 
                placeholder="أضف تعليق..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-green-400 p-0"
                onClick={() => setShowVoiceRecorder(true)}
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-400 hover:text-green-300 text-sm font-semibold p-0"
              >
                نشر
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;
