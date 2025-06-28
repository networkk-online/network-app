
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PostProps {
  id: string;
  username: string;
  userAvatar: string;
  image: string;
  caption: string;
  likes: number;
  timeAgo: string;
  walletEarnings: number;
}

const Post = ({ username, userAvatar, image, caption, likes, timeAgo, walletEarnings }: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
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

      {/* Post Image */}
      <div className="relative">
        <img 
          src={image} 
          alt="Post content"
          className="w-full h-96 object-cover"
        />
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 hover:bg-transparent"
              onClick={handleLike}
            >
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white hover:text-gray-300'}`} 
              />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <MessageCircle className="w-6 h-6 hover:text-gray-300" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
              <Send className="w-6 h-6 hover:text-gray-300" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
            <Bookmark className="w-6 h-6 hover:text-gray-300" />
          </Button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold mb-2">{likeCount.toLocaleString()} likes</p>

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
        <div className="flex items-center space-x-3 pt-3 border-t border-gray-800">
          <input 
            type="text" 
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-green-400 hover:text-green-300 text-sm font-semibold p-0"
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Post;
