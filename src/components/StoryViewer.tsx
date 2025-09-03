import { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, MoreHorizontal, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Story {
  id: string;
  username: string;
  avatar: string;
  image: string;
  timestamp: string;
  duration?: number;
}

interface StoryViewerProps {
  stories: Story[];
  currentStoryIndex: number;
  onClose: () => void;
  onStoryChange: (index: number) => void;
}

const StoryViewer = ({ stories, currentStoryIndex, onClose, onStoryChange }: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentStory = stories[currentStoryIndex];
  const storyDuration = currentStory?.duration || 5000; // 5 seconds default

  // Progress animation
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentStoryIndex, storyDuration]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setIsLiked(false);
  }, [currentStoryIndex]);

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      onStoryChange(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      onStoryChange(currentStoryIndex - 1);
    }
  };

  const handleScreenTap = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const screenWidth = rect.width;
    
    if (tapX < screenWidth / 3) {
      handlePrevStory();
    } else if (tapX > (screenWidth * 2) / 3) {
      handleNextStory();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleDoubleClick = () => {
    setIsLiked(true);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleSendComment = () => {
    if (comment.trim()) {
      // Here you would typically send the comment to your backend
      console.log('Comment sent:', comment);
      setComment('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendComment();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-white transition-all duration-100 ${
                index < currentStoryIndex ? 'w-full' : 
                index === currentStoryIndex ? '' : 'w-0'
              }`}
              style={index === currentStoryIndex ? { width: `${progress}%` } : {}}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <img 
            src={currentStory.avatar} 
            alt={currentStory.username}
            className="w-8 h-8 rounded-full border border-white"
          />
          <span className="text-white font-medium text-sm">{currentStory.username}</span>
          <span className="text-white/70 text-xs">{currentStory.timestamp}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 hover:bg-white/20"
          >
            {isPlaying ? 
              <Pause className="w-5 h-5 text-white" /> : 
              <Play className="w-5 h-5 text-white" />
            }
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 hover:bg-white/20"
          >
            {isMuted ? 
              <VolumeX className="w-5 h-5 text-white" /> : 
              <Volume2 className="w-5 h-5 text-white" />
            }
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 hover:bg-white/20"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-white/20"
          >
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* Story content */}
      <div 
        className="relative w-full h-full max-w-md mx-auto cursor-pointer"
        onClick={handleScreenTap}
        onDoubleClick={handleDoubleClick}
      >
        <img 
          src={currentStory.image} 
          alt="Story content"
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Double tap heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-20 h-20 text-white fill-white animate-ping" />
          </div>
        )}

        {/* Tap areas for navigation (invisible) */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" />
        </div>
      </div>

      {/* Bottom interaction area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
        <div className="max-w-md mx-auto">
          {/* Like and reply buttons */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 hover:bg-white/20 rounded-full"
            >
              <Heart 
                className={`w-6 h-6 transition-all duration-300 ${
                  isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-white'
                }`} 
              />
            </Button>
            
            <div className="text-center">
              <div className="text-white text-sm font-medium">
                {Math.floor(Math.random() * 100) + 50} مشاهدة
              </div>
            </div>
          </div>

          {/* Comment input */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full p-2 border border-white/20">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="أرسل رسالة..."
              className="flex-1 bg-transparent border-none text-white placeholder-white/70 focus:ring-0 text-sm"
            />
            <Button
              onClick={handleSendComment}
              disabled={!comment.trim()}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Quick reactions */}
          <div className="flex justify-center space-x-4 mt-3">
            {['❤️', '😍', '😂', '😮', '😢', '👏'].map((emoji, index) => (
              <button
                key={index}
                className="text-2xl hover:scale-125 transition-transform duration-200"
                onClick={() => {
                  // Send quick reaction
                  console.log('Quick reaction:', emoji);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/50 text-xs text-center z-10">
        اضغط على الجانبين للتنقل • اضغط في الوسط للإيقاف
      </div>
    </div>
  );
};

export default StoryViewer;