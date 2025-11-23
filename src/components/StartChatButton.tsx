import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StartChatButtonProps {
  otherUserId: string;
  className?: string;
}

export const StartChatButton = ({ otherUserId, className }: StartChatButtonProps) => {
  const navigate = useNavigate();

  const handleStartChat = async () => {
    navigate(`/messages?userId=${otherUserId}`);
  };

  return (
    <Button
      onClick={handleStartChat}
      className={className}
    >
      <MessageCircle className="w-4 h-4 ml-2" />
      مراسلة
    </Button>
  );
};
