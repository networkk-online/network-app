import { useState, useEffect } from 'react';
import { HelpCircle, Send, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface StoryQuestionProps {
  storyId: string;
  questionText: string;
  isOwner: boolean;
  storyOwnerId: string;
}

interface QuestionResponse {
  id: string;
  user_id: string;
  response_text: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export const StoryQuestion = ({ storyId, questionText, isOwner, storyOwnerId }: StoryQuestionProps) => {
  const { toast } = useToast();
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    checkIfResponded();
    if (isOwner) {
      loadResponses();
      subscribeToResponses();
    }
  }, [storyId, isOwner]);

  const checkIfResponded = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('story_question_responses')
      .select('id')
      .eq('story_id', storyId)
      .eq('user_id', user.id)
      .maybeSingle();

    setHasResponded(!!data);
  };

  const loadResponses = async () => {
    const { data } = await supabase
      .from('story_question_responses')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (data) {
      setResponses(data as any);
    }
  };

  const subscribeToResponses = () => {
    const channel = supabase
      .channel(`story-question-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_question_responses',
          filter: `story_id=eq.${storyId}`
        },
        () => {
          loadResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async () => {
    if (!response.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول للرد',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('story_question_responses')
      .insert({
        story_id: storyId,
        user_id: user.id,
        response_text: response.trim()
      });

    setSubmitting(false);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل إرسال الرد',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'تم',
        description: 'تم إرسال ردك بنجاح'
      });
      setResponse('');
      setHasResponded(true);
    }
  };

  if (isOwner && showStats) {
    return (
      <div className="absolute bottom-20 left-4 right-4 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-2xl p-4 border border-gray-700 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">الردود على السؤال</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowStats(false)}
          >
            إخفاء
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4 p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-gray-300">{responses.length} رد</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-300">
              {responses.length > 0 ? 'تفاعل نشط' : 'لا توجد ردود بعد'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {responses.map((resp) => (
            <div key={resp.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <img
                src={resp.profiles?.avatar_url || '/placeholder.svg'}
                alt={resp.profiles?.username || 'مستخدم'}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-white">
                  {resp.profiles?.username || 'مستخدم'}
                </p>
                <p className="text-sm text-gray-300 mt-1">{resp.response_text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-20 left-4 right-4">
      <div className="bg-gradient-to-br from-primary/20 to-primary-glow/20 backdrop-blur-lg rounded-2xl p-4 border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-primary" />
          <p className="text-white font-medium">{questionText}</p>
        </div>

        {isOwner ? (
          <div className="space-y-2">
            <Button
              onClick={() => setShowStats(true)}
              className="w-full"
              variant="secondary"
            >
              <Users className="w-4 h-4 mr-2" />
              عرض الردود ({responses.length})
            </Button>
          </div>
        ) : hasResponded ? (
          <div className="text-center py-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              ✓ تم إرسال ردك
            </Badge>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="اكتب ردك هنا..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || !response.trim()}
              className="w-full"
            >
              {submitting ? (
                'جاري الإرسال...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  إرسال الرد
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};