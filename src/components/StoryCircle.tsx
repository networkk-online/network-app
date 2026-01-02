import { Camera, Plus } from 'lucide-react';

interface StoryCircleProps {
  username: string;
  avatar: string;
  hasStory?: boolean;
  isOwn?: boolean;
  hasViewed?: boolean;
  onClick: () => void;
  onCameraClick?: () => void;
}

const StoryCircle = ({ username, avatar, hasStory = false, isOwn = false, hasViewed = false, onClick, onCameraClick }: StoryCircleProps) => {
  const getBorderStyle = () => {
    if (!hasStory) return 'p-0.5 bg-gray-700';
    if (hasViewed) return 'p-0.5 bg-gray-500'; // رمادي بعد المشاهدة
    return 'p-0.5 bg-gradient-to-tr from-orange-400 via-orange-500 to-orange-600'; // برتقالي قبل المشاهدة
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="relative cursor-pointer" onClick={onClick}>
        <div className={`${getBorderStyle()} rounded-full`}>
          <div className="bg-black p-0.5 rounded-full">
            <img 
              src={avatar}
              alt={username}
              className="w-16 h-16 rounded-full object-cover border-2 border-black"
            />
          </div>
        </div>
        
        {/* زر الإضافة للقصة الخاصة */}
        {isOwn && !hasStory && (
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-black">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      {/* زر الكاميرا أسفل قصتك */}
      {isOwn && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCameraClick?.();
          }}
          className="bg-primary/20 hover:bg-primary/40 rounded-full p-1 transition-colors mt-0.5"
        >
          <Camera className="w-3 h-3 text-primary" />
        </button>
      )}
      
      <span className="text-xs text-gray-300 max-w-[70px] truncate">
        {isOwn ? 'قصتك' : username}
      </span>
    </div>
  );
};

export default StoryCircle;
