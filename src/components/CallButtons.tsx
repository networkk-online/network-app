import { Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChimeCall } from '@/components/ChimeCallProvider';
import { toast } from '@/hooks/use-toast';

interface CallButtonsProps {
  participant: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default' | 'purple';
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
  const { startCall, isInCall, isInitialized, isConnecting } = useChimeCall();

  const handleVoiceCall = async () => {
    if (!isInitialized) {
      toast({
        title: 'جاري التحميل',
        description: 'يرجى الانتظار...',
      });
      return;
    }

    if (isInCall || isConnecting) {
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

    if (isInCall || isConnecting) {
      toast({
        title: 'مكالمة جارية',
        description: 'أنت في مكالمة حالياً',
        variant: 'destructive',
      });
      return;
    }

    await startCall(participant, 'video');
  };

  // Purple variant styling for chat header
  const isPurple = variant === 'purple';
  const buttonVariant = isPurple ? 'ghost' : variant;
  const purpleClasses = isPurple ? 'bg-purple-600/30 hover:bg-purple-600/50 text-white' : '';

  if (showLabels) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant={buttonVariant}
          size={size}
          onClick={handleVoiceCall}
          className={`flex items-center gap-2 ${purpleClasses}`}
        >
          <Phone className="h-4 w-4" />
          <span>مكالمة صوتية</span>
        </Button>
        <Button
          variant={buttonVariant}
          size={size}
          onClick={handleVideoCall}
          className={`flex items-center gap-2 ${purpleClasses}`}
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
        variant={buttonVariant}
        size={size}
        onClick={handleVoiceCall}
        title="مكالمة صوتية"
        className={`h-11 w-11 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-all ${purpleClasses}`}
      >
        <Phone className="h-5 w-5" />
      </Button>
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleVideoCall}
        title="مكالمة فيديو"
        className={`h-11 w-11 rounded-full border-2 border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-all ${purpleClasses}`}
      >
        <Video className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CallButtons;