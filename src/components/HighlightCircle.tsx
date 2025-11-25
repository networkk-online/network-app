import { Avatar } from './ui/avatar';

interface HighlightCircleProps {
  title: string;
  coverImage?: string;
  onClick: () => void;
}

export const HighlightCircle = ({ title, coverImage, onClick }: HighlightCircleProps) => {
  return (
    <div 
      className="flex flex-col items-center gap-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="w-16 h-16 border-2 border-gray-300 dark:border-gray-600">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>
      </div>
      <span className="text-xs text-center max-w-[70px] truncate">
        {title}
      </span>
    </div>
  );
};