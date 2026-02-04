import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AISmartReplyProps {
  lastMessage?: string;
  conversationHistory?: Message[];
  onSelectSuggestion: (suggestion: string) => void;
  onClose?: () => void;
}

export const AISmartReply = ({
  lastMessage,
  conversationHistory = [],
  onSelectSuggestion,
  onClose,
}: AISmartReplyProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Generate suggestions when last message changes
  useEffect(() => {
    if (lastMessage && lastMessage.trim()) {
      generateSuggestions();
    }
  }, [lastMessage]);

  const generateSuggestions = async () => {
    if (!lastMessage) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-smart-reply', {
        body: {
          lastMessage,
          conversationHistory: conversationHistory.slice(-10), // Last 10 messages for context
        },
      });

      if (funcError) {
        if (funcError.message?.includes('429')) {
          setError('الكثير من الطلبات، حاول لاحقاً');
        } else if (funcError.message?.includes('402')) {
          setError('يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي');
        } else {
          throw funcError;
        }
        return;
      }

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions.slice(0, 4));
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      // Fallback suggestions based on message content
      const fallbackSuggestions = generateFallbackSuggestions(lastMessage);
      setSuggestions(fallbackSuggestions);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback suggestions if AI fails
  const generateFallbackSuggestions = (message: string): string[] => {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('مرحبا') || lowerMessage.includes('هلو') || lowerMessage.includes('السلام')) {
      return ['أهلاً وسهلاً! 👋', 'مرحبا! كيف حالك؟', 'هلا والله! شخبارك؟', 'السلام عليكم ورحمة الله'];
    }
    
    // How are you
    if (lowerMessage.includes('كيف حال') || lowerMessage.includes('شلونك') || lowerMessage.includes('شخبار')) {
      return ['الحمدلله بخير، وانت؟', 'تمام الله يسلمك!', 'ماشي الحال 💪', 'زين الله يعافيك'];
    }
    
    // Question markers
    if (message.includes('؟') || lowerMessage.includes('شنو') || lowerMessage.includes('ليش')) {
      return ['نعم أكيد!', 'خليني أفكر...', 'لا أعتقد ذلك', 'صراحة ما أدري'];
    }
    
    // Photo/Video messages
    if (lowerMessage.includes('صورة') || lowerMessage.includes('فيديو')) {
      return ['حلوة! 😍', 'روعة ماشاء الله!', 'وين هذا المكان؟', 'شكراً للمشاركة!'];
    }
    
    // Default responses
    return ['👍', '😊 تمام!', 'شكراً لك!', 'أكيد!'];
  };

  const handleSelect = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !lastMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="px-4 pb-2"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#833AB4]" />
            <span className="text-xs text-white/60">اقتراحات ذكية</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={generateSuggestions}
              disabled={isLoading}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-white/40",
                isLoading && "animate-spin"
              )} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </motion.button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-xs text-red-400 mb-2">{error}</div>
        )}

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                className="h-8 w-20 bg-white/10 rounded-full"
              />
            ))
          ) : (
            suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm',
                  'bg-gradient-to-r from-[#833AB4]/20 to-[#E1306C]/20',
                  'border border-[#833AB4]/30',
                  'text-white hover:bg-white/10 transition-all'
                )}
              >
                {suggestion}
              </motion.button>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
