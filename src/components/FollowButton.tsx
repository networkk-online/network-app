import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  onOptimisticChange?: (nextIsFollowing: boolean, prevIsFollowing: boolean) => void;
  onRevertChange?: (prevIsFollowing: boolean, optimisticIsFollowing: boolean) => void;
}

export const FollowButton = ({
  userId,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  onOptimisticChange,
  onRevertChange,
}: FollowButtonProps) => {
  const { isFollowing, loading, toggleFollow, isOwnProfile } = useFollow(userId, {
    onOptimisticChange,
    onRevertChange,
  });

  if (isOwnProfile) {
    return null;
  }

  // Dynamic styling based on follow state
  const followingStyles = isFollowing 
    ? 'bg-green-500 hover:bg-green-600 text-white border-0' 
    : 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      variant="default"
      size={size}
      className={`gap-2 ${followingStyles} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />
      ) : null}
      {isFollowing ? 'إلغاء المتابعة' : 'متابعة'}
    </Button>
  );
};
