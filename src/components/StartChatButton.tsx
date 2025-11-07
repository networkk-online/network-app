import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';

interface StartChatButtonProps {
  otherUserId: string;
  className?: string;
}

export const StartChatButton = ({ otherUserId, className }: StartChatButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createConversation } = useMessages();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);
    try {
      const result = await createConversation(otherUserId);
      
      if (result?.success) {
        navigate(`/messages`);
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء بدء المحادثة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={loading}
      className={className}
    >
      <MessageCircle className="w-4 h-4 ml-2" />
      {loading ? 'جاري...' : 'مراسلة'}
    </Button>
  );
};
