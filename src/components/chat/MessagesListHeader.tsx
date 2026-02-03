import { motion } from 'framer-motion';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface MessagesListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewMessage: () => void;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export const MessagesListHeader = ({ 
  searchQuery, 
  onSearchChange, 
  onNewMessage 
}: MessagesListHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <motion.div 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springConfig}
      className="sticky top-0 z-50 p-4 border-b border-white/10 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
              onClick={handleBack}
            >
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>
          </motion.div>
          <h1 className="text-xl font-bold text-white">الرسائل</h1>
        </div>
        <motion.div 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          transition={springConfig}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewMessage}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Search Bar with Glass Effect */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="البحث في الرسائل"
          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl backdrop-blur-md focus:border-purple-500/50 focus:ring-purple-500/20"
        />
      </div>
    </motion.div>
  );
};
