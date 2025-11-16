import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useCloseFriends } from '@/hooks/useCloseFriends';

interface CloseFriendsButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const CloseFriendsButton = ({ 
  userId, 
  variant = 'outline', 
  size = 'default',
  className = '',
  showIcon = true 
}: CloseFriendsButtonProps) => {
  const { isCloseFriend, loading, toggleCloseFriend, isOwnProfile } = useCloseFriends(userId);

  if (isOwnProfile) {
    return null;
  }

  return (
    <Button
      onClick={toggleCloseFriend}
      disabled={loading}
      variant={isCloseFriend ? 'default' : variant}
      size={size}
      className={`gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <Star className={`h-4 w-4 ${isCloseFriend ? 'fill-current' : ''}`} />
      ) : null}
      {isCloseFriend ? 'صديق مقرب' : 'إضافة للمقربين'}
    </Button>
  );
};
