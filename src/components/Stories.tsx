
import { Plus, Heart } from 'lucide-react';
import { useState } from 'react';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  username: string;
  avatar: string;
  hasViewed: boolean;
  isOwn?: boolean;
  likes?: number;
  isLiked?: boolean;
  image?: string;
  timestamp?: string;
}

interface StoriesProps {
  stories: Story[];
}

const Stories = ({ stories }: StoriesProps) => {
  const [storyLikes, setStoryLikes] = useState<Record<string, { isLiked: boolean; count: number }>>(
    stories.reduce((acc, story) => {
      acc[story.id] = {
        isLiked: story.isLiked || false,
        count: story.likes || Math.floor(Math.random() * 50) + 10
      };
      return acc;
    }, {} as Record<string, { isLiked: boolean; count: number }>)
  );

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  // Add mock story data for viewer
  const storyData = stories.map(story => ({
    ...story,
    image: story.image || story.avatar, // Use avatar as fallback
    timestamp: story.timestamp || 'منذ ساعة'
  }));

  const handleStoryLike = (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStoryLikes(prev => ({
      ...prev,
      [storyId]: {
        isLiked: !prev[storyId].isLiked,
        count: prev[storyId].isLiked ? prev[storyId].count - 1 : prev[storyId].count + 1
      }
    }));
  };

  const handleStoryClick = (index: number) => {
    setCurrentStoryIndex(index);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  const handleStoryChange = (index: number) => {
    setCurrentStoryIndex(index);
  };

  return (
    <>
      <div className="bg-black border-b border-gray-800 py-4 mb-6">
        <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide">
          {stories.map((story, index) => (
            <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
              <div className="relative group cursor-pointer">
                <div 
                  className={`w-16 h-16 rounded-full p-0.5 transition-all duration-300 ${
                    story.hasViewed 
                      ? 'bg-gray-500' 
                      : 'bg-gradient-to-tr from-orange-400 to-orange-600'
                  } group-hover:scale-105`}
                  onClick={() => handleStoryClick(index)}
                >
                  <img 
                    src={story.avatar} 
                    alt={story.username}
                    className="w-full h-full rounded-full object-cover border-2 border-black"
                  />
                </div>
                
                {/* Story Like Button */}
                <button
                  onClick={(e) => handleStoryLike(story.id, e)}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center border border-gray-600 hover:bg-black/90 transition-all duration-200 group-hover:scale-110"
                >
                  <Heart 
                    className={`w-4 h-4 transition-all duration-200 ${
                      storyLikes[story.id]?.isLiked 
                        ? 'fill-red-500 text-red-500 animate-pulse' 
                        : 'text-white hover:text-red-400'
                    }`} 
                  />
                </button>

                {/* Story Likes Count */}
                {storyLikes[story.id]?.count > 0 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full border border-pink-400 shadow-lg">
                    {storyLikes[story.id].count}
                  </div>
                )}
                
                {story.isOwn && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center border-2 border-black">
                    <Plus className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              <span className="text-xs text-white text-center w-16 truncate mt-2">
                {story.isOwn ? 'قصتك' : story.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer */}
      {isViewerOpen && (
        <StoryViewer
          stories={storyData}
          currentStoryIndex={currentStoryIndex}
          onClose={handleCloseViewer}
          onStoryChange={handleStoryChange}
        />
      )}
    </>
  );
};

export default Stories;
