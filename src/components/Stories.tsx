
import { Plus } from 'lucide-react';

interface Story {
  id: string;
  username: string;
  avatar: string;
  hasViewed: boolean;
  isOwn?: boolean;
}

interface StoriesProps {
  stories: Story[];
}

const Stories = ({ stories }: StoriesProps) => {
  return (
    <div className="bg-black border-b border-gray-800 py-4 mb-6">
      <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-hide">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full p-0.5 ${
                story.hasViewed 
                  ? 'bg-gray-500' 
                  : 'bg-gradient-to-tr from-green-400 to-green-600'
              }`}>
                <img 
                  src={story.avatar} 
                  alt={story.username}
                  className="w-full h-full rounded-full object-cover border-2 border-black"
                />
              </div>
              {story.isOwn && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                  <Plus className="w-3 h-3 text-black" />
                </div>
              )}
            </div>
            <span className="text-xs text-white text-center w-16 truncate">
              {story.isOwn ? 'Your Story' : story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
