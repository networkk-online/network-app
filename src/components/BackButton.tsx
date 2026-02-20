import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

const BackButton = ({ fallbackPath = '/', className = '' }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`p-2 hover:bg-secondary ${className}`}
      aria-label="رجوع"
    >
      <ArrowRight className="w-5 h-5" />
    </Button>
  );
};

export default BackButton;
