import { useState } from 'react';
import { HelpCircle, BarChart3, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface StoryInteractiveProps {
  onInteractiveChange: (data: any) => void;
}

export const StoryInteractive = ({ onInteractiveChange }: StoryInteractiveProps) => {
  const [interactiveType, setInteractiveType] = useState<'none' | 'question' | 'poll' | 'sticker'>('none');
  const [questionText, setQuestionText] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handleTypeChange = (type: 'none' | 'question' | 'poll' | 'sticker') => {
    setInteractiveType(type);
    if (type === 'none') {
      onInteractiveChange(null);
    }
  };

  const handleQuestionSubmit = () => {
    if (questionText.trim()) {
      onInteractiveChange({
        type: 'question',
        question_text: questionText
      });
    }
  };

  const handlePollSubmit = () => {
    if (pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
      onInteractiveChange({
        type: 'poll',
        poll_question: pollQuestion,
        poll_options: pollOptions.filter(o => o.trim())
      });
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
      <Label>إضافة عنصر تفاعلي</Label>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant={interactiveType === 'question' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('question')}
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          سؤال
        </Button>
        <Button
          type="button"
          variant={interactiveType === 'poll' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('poll')}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          استفتاء
        </Button>
        <Button
          type="button"
          variant={interactiveType === 'sticker' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleTypeChange('sticker')}
        >
          <Smile className="w-4 h-4 mr-1" />
          ملصق
        </Button>
        {interactiveType !== 'none' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleTypeChange('none')}
          >
            إلغاء
          </Button>
        )}
      </div>

      {interactiveType === 'question' && (
        <div className="space-y-2">
          <Textarea
            placeholder="اكتب سؤالك هنا..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleQuestionSubmit}
            disabled={!questionText.trim()}
          >
            إضافة السؤال
          </Button>
        </div>
      )}

      {interactiveType === 'poll' && (
        <div className="space-y-2">
          <Input
            placeholder="سؤال الاستفتاء..."
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          {pollOptions.map((option, index) => (
            <Input
              key={index}
              placeholder={`الخيار ${index + 1}`}
              value={option}
              onChange={(e) => {
                const newOptions = [...pollOptions];
                newOptions[index] = e.target.value;
                setPollOptions(newOptions);
              }}
            />
          ))}
          {pollOptions.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPollOption}
            >
              إضافة خيار
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handlePollSubmit}
            disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
          >
            إضافة الاستفتاء
          </Button>
        </div>
      )}

      {interactiveType === 'sticker' && (
        <div className="text-center text-gray-400 py-4">
          <p>الملصقات قيد التطوير</p>
        </div>
      )}
    </div>
  );
};