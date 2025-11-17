import { Avatar } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';

interface StoryCircleProps {
  username: string;
  avatar: string;
  hasStory?: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

const StoryCircle = ({ username, avatar, hasStory = false, isOwn = false, onClick }: StoryCircleProps) => {
  return (
    <div className="flex flex-col items-center space-y-1 cursor-pointer" onClick={onClick}>
      <div className="relative">
        <div className={`${hasStory ? 'p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'p-0.5 bg-gray-700'} rounded-full`}>
          <div className="bg-black p-0.5 rounded-full">
            <img 
              src={avatar}
              alt={username}
              className="w-16 h-16 rounded-full object-cover border-2 border-black"
            />
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-300 max-w-[70px] truncate">
        {isOwn ? 'قصتك' : username}
      </span>
    </div>
  );
};

export default StoryCircle;
