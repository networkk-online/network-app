import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { StoryViewers } from './StoryViewers';
import { useStoryViews } from '@/hooks/useStoryViews';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const StoryViewer = ({ stories, currentIndex, onClose, onNext, onPrev }: StoryViewerProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const currentStory = stories[currentIndex];
  const { recordView } = useStoryViews(currentStory?.id || '');

  useEffect(() => {
    if (!currentStory) return;

    // Check if this is the current user's story
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnStory(user?.id === currentStory.user_id);
      
      // Record view if not own story
      if (user && user.id !== currentStory.user_id) {
        recordView();
      }
    };
    checkOwnership();

    // Reset progress
    setProgress(0);
    
    // Auto progress
    const duration = currentStory.media_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          if (currentIndex < stories.length - 1) {
            onNext();
          } else {
            onClose();
          }
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory]);

  if (!currentStory) return null;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'الآن';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}د`;
    return `${Math.floor(seconds / 3600)}س`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-3">
          <img 
            src={currentStory.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
            alt={currentStory.profiles?.username || ''}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.profiles?.username}</p>
            <p className="text-gray-300 text-sm">{timeAgo(currentStory.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwnStory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowViewers(true)}
              className="text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4 mr-2" />
              {currentStory.views_count}
            </Button>
          )}
          <button onClick={onClose} className="text-blue-500 hover:text-blue-400 p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button 
          onClick={onPrev}
          className="absolute left-4 z-10 bg-black/50 p-3 rounded-full hover:bg-black/70"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
      
      {currentIndex < stories.length - 1 && (
        <button 
          onClick={onNext}
          className="absolute right-4 z-10 bg-black/50 p-3 rounded-full hover:bg-black/70"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Media content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.media_type === 'video' ? (
          <video 
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img 
            src={currentStory.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Click areas for navigation */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={onPrev} />
        <div className="flex-1" onClick={onNext} />
      </div>

      {/* Viewers Dialog */}
      <Dialog open={showViewers} onOpenChange={setShowViewers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>المشاهدات</DialogTitle>
          </DialogHeader>
          <StoryViewers storyId={currentStory.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryViewer;
