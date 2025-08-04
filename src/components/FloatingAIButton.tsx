import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FloatingAIButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/ai-tools')}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg transition-all duration-300 hover:scale-110 group"
      size="icon"
    >
      <Brain className="w-6 h-6 text-white group-hover:animate-pulse" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 animate-ping"></div>
    </Button>
  );
};

export default FloatingAIButton;