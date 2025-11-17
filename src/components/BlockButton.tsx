import { Button } from '@/components/ui/button';
import { Ban, Loader2 } from 'lucide-react';
import { useBlockUser } from '@/hooks/useBlockUser';

interface BlockButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const BlockButton = ({ 
  userId, 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}: BlockButtonProps) => {
  const { isBlocked, loading, toggleBlock, isOwnProfile } = useBlockUser(userId);

  if (isOwnProfile) {
    return null;
  }

  return (
    <Button
      onClick={toggleBlock}
      disabled={loading}
      variant={variant}
      size={size}
      className={`${isBlocked ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'} ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin ml-2" />
      ) : (
        <Ban className="h-4 w-4 ml-2" />
      )}
      {isBlocked ? 'إلغاء الحظر' : 'حظر'}
    </Button>
  );
};
