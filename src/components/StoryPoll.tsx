import { useState, useEffect } from 'react';
import { BarChart3, Check, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface StoryPollProps {
  storyId: string;
  pollQuestion: string;
  pollOptions: string[];
  pollVotes: Record<string, string[]>; // { optionIndex: [userId1, userId2, ...] }
  isOwner: boolean;
}

export const StoryPoll = ({ storyId, pollQuestion, pollOptions, pollVotes, isOwner }: StoryPollProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVotes, setCurrentVotes] = useState<Record<string, string[]>>(pollVotes || {});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    checkIfVoted();
    subscribeToVotes();
  }, [storyId]);

  const checkIfVoted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has voted
    Object.entries(currentVotes).forEach(([optionIdx, voters]) => {
      if (voters.includes(user.id)) {
        setHasVoted(true);
        setSelectedOption(parseInt(optionIdx));
        setShowResults(true);
      }
    });
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`story-poll-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`
        },
        (payload: any) => {
          if (payload.new.poll_votes) {
            setCurrentVotes(payload.new.poll_votes);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (optionIndex: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول للتصويت',
        variant: 'destructive'
      });
      return;
    }

    if (hasVoted) return;

    const updatedVotes = { ...currentVotes };
    if (!updatedVotes[optionIndex]) {
      updatedVotes[optionIndex] = [];
    }
    updatedVotes[optionIndex].push(user.id);

    const { error } = await supabase
      .from('stories')
      .update({ poll_votes: updatedVotes })
      .eq('id', storyId);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل التصويت',
        variant: 'destructive'
      });
    } else {
      setSelectedOption(optionIndex);
      setHasVoted(true);
      setShowResults(true);
      setCurrentVotes(updatedVotes);
      toast({
        title: 'تم',
        description: 'تم تسجيل تصويتك'
      });
    }
  };

  const getTotalVotes = () => {
    return Object.values(currentVotes).reduce((sum, voters) => sum + voters.length, 0);
  };

  const getOptionPercentage = (optionIndex: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    const optionVotes = currentVotes[optionIndex]?.length || 0;
    return Math.round((optionVotes / total) * 100);
  };

  const getOptionVotes = (optionIndex: number) => {
    return currentVotes[optionIndex]?.length || 0;
  };

  return (
    <div className="absolute bottom-20 left-4 right-4">
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <p className="text-white font-medium">{pollQuestion}</p>
        </div>

        {(showResults || isOwner) && getTotalVotes() > 0 && (
          <div className="flex items-center gap-3 mb-3 p-2 bg-purple-500/10 rounded-lg">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white">{getTotalVotes()} صوت</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
        )}

        <div className="space-y-2">
          {pollOptions.map((option, index) => {
            const percentage = getOptionPercentage(index);
            const votes = getOptionVotes(index);
            const isSelected = selectedOption === index;
            const showPercentage = showResults || isOwner;

            return (
              <button
                key={index}
                onClick={() => !hasVoted && handleVote(index)}
                disabled={hasVoted || isOwner}
                className={`w-full text-right p-3 rounded-xl transition-all ${
                  showPercentage
                    ? 'bg-white/10 cursor-default'
                    : 'bg-white/10 hover:bg-white/20 active:scale-95 cursor-pointer'
                } ${isSelected ? 'ring-2 ring-purple-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{option}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  {showPercentage && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-bold">{percentage}%</span>
                      <Badge variant="secondary" className="text-xs">
                        {votes}
                      </Badge>
                    </div>
                  )}
                </div>
                {showPercentage && (
                  <Progress 
                    value={percentage} 
                    className="h-1.5 bg-white/10"
                  />
                )}
              </button>
            );
          })}
        </div>

        {hasVoted && !isOwner && (
          <div className="text-center mt-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ✓ تم تسجيل تصويتك
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};