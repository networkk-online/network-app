import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCall } from '@/components/CallProvider';
import { toast } from '@/hooks/use-toast';

interface CallButtonsProps {
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  showLabels?: boolean;
  className?: string;
}

const CallButtons = ({ 
  participant, 
  size = 'icon', 
  variant = 'ghost',
  showLabels = false,
  className = ''
}: CallButtonsProps) => {
  const { startCall, isInCall, isInitialized } = useCall();

  const handleVoiceCall = async () => {
    if (!isInitialized) {
      toast({
        title: 'جاري التحميل',
        description: 'يرجى الانتظار...',
      });
      return;
    }

    if (isInCall) {
      toast({
        title: 'مكالمة جارية',
        description: 'أنت في مكالمة حالياً',
        variant: 'destructive',
      });
      return;
    }

    await startCall(participant, 'voice');
  };

  const handleVideoCall = async () => {
    if (!isInitialized) {
      toast({
        title: 'جاري التحميل',
        description: 'يرجى الانتظار...',
      });
      return;
    }

    if (isInCall) {
      toast({
        title: 'مكالمة جارية',
        description: 'أنت في مكالمة حالياً',
        variant: 'destructive',
      });
      return;
    }

    await startCall(participant, 'video');
  };

  if (showLabels) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant={variant}
          size={size}
          onClick={handleVoiceCall}
          className="flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          <span>مكالمة صوتية</span>
        </Button>
        <Button
          variant={variant}
          size={size}
          onClick={handleVideoCall}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          <span>مكالمة فيديو</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleVoiceCall}
        title="مكالمة صوتية"
      >
        <Phone className="h-5 w-5" />
      </Button>
      <Button
        variant={variant}
        size={size}
        onClick={handleVideoCall}
        title="مكالمة فيديو"
      >
        <Video className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CallButtons;
