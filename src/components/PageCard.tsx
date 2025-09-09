
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Plus } from 'lucide-react';

interface PageCardProps {
  id: string;
  name: string;
  category: string;
  type: 'celebrity' | 'business' | 'media';
  avatar: string;
  cover: string;
  followers: number;
  description: string;
  isVerified: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  typeIcon: React.ReactNode;
}

const PageCard = ({
  name,
  category,
  avatar,
  cover,
  followers,
  description,
  isVerified,
  isFollowing,
  onFollow,
  typeIcon,
  type
}: PageCardProps) => {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}م`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}ك`;
    }
    return count.toString();
  };

  // تحديد لون الشارة حسب نوع الحساب
  const getVerificationBadgeColor = (accountType: 'celebrity' | 'business' | 'media') => {
    switch (accountType) {
      case 'business':
        return 'text-yellow-400'; // ذهبي للشركات
      case 'celebrity':
        return 'text-blue-500'; // أزرق للمشاهير
      case 'media':
        return 'text-gray-500'; // رصاصي للشخصيات المهمة
      default:
        return 'text-green-500';
    }
  };

  const verificationColor = getVerificationBadgeColor(type);

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-green-500/30 transition-all duration-300">
      {/* Cover Image */}
      <div className="relative h-24 bg-gradient-to-r from-green-500/20 to-blue-500/20">
        <img 
          src={cover} 
          alt={`${name} cover`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <CardContent className="p-4">
        {/* Avatar and Info */}
        <div className="flex items-start space-x-3 -mt-8 mb-4">
          <div className="relative">
            <img 
              src={avatar} 
              alt={name}
              className="w-16 h-16 rounded-full border-4 border-gray-900 object-cover"
            />
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 animate-pulse">
                <img 
                  src="/lovable-uploads/20196b8b-fafa-4347-9c0f-d0c97279f466.png" 
                  alt="Verified badge" 
                  className={`w-6 h-6 drop-shadow-lg hover:scale-110 transition-transform duration-300 ${type === 'business' ? '' : type === 'celebrity' ? 'hue-rotate-[200deg] saturate-150' : 'saturate-0 brightness-75'}`}
                />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-white text-lg">{name}</h3>
              {isVerified && (
                <img 
                  src="/lovable-uploads/20196b8b-fafa-4347-9c0f-d0c97279f466.png" 
                  alt="Verified" 
                  className={`w-6 h-6 drop-shadow-md hover:rotate-12 transition-all duration-300 ${type === 'business' ? '' : type === 'celebrity' ? 'hue-rotate-[200deg] saturate-150' : 'saturate-0 brightness-75'}`}
                />
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {typeIcon}
              <span className="mr-1">{category}</span>
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
          {description}
        </p>

        {/* Followers Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">
            {formatFollowers(followers)} متابع
          </span>
          {isVerified && (
            <div className="flex items-center space-x-1">
              <img 
                src="/lovable-uploads/20196b8b-fafa-4347-9c0f-d0c97279f466.png" 
                alt="Verified" 
                className={`w-5 h-5 drop-shadow-sm hover:rotate-6 transition-transform duration-200 ${type === 'business' ? '' : type === 'celebrity' ? 'hue-rotate-[200deg] saturate-150' : 'saturate-0 brightness-75'}`}
              />
              <span className={`text-xs font-bold ${type === 'business' ? 'text-yellow-400' : type === 'celebrity' ? 'text-blue-400' : 'text-gray-400'}`}>
                {type === 'business' ? 'شركة موثقة' : type === 'celebrity' ? 'مشهور موثق' : 'شخصية مهمة'}
              </span>
            </div>
          )}
        </div>

        {/* Follow Button */}
        <Button
          onClick={onFollow}
          className={`w-full ${
            isFollowing
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-green-500 hover:bg-green-600 text-black'
          }`}
        >
          {isFollowing ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              متابَع
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              متابعة
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PageCard;
