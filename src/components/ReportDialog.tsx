import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportDialogProps {
  reportedUserId?: string;
  postId?: string;
  reelId?: string;
  commentId?: string;
}

const reportTypes = [
  { value: 'spam', label: 'محتوى مزعج أو إعلانات' },
  { value: 'harassment', label: 'تحرش أو تنمر' },
  { value: 'hate_speech', label: 'خطاب كراهية' },
  { value: 'violence', label: 'عنف أو محتوى خطير' },
  { value: 'nudity', label: 'عري أو محتوى جنسي' },
  { value: 'false_info', label: 'معلومات مضللة أو كاذبة' },
  { value: 'intellectual_property', label: 'انتهاك حقوق الملكية الفكرية' },
  { value: 'impersonation', label: 'انتحال شخصية' },
  { value: 'self_harm', label: 'إيذاء النفس أو الانتحار' },
  { value: 'child_safety', label: 'استغلال الأطفال' },
  { value: 'illegal_activities', label: 'أنشطة غير قانونية' },
  { value: 'terrorism', label: 'الترويج للإرهاب' },
  { value: 'other', label: 'أخرى' },
];

export const ReportDialog = ({ reportedUserId, postId, reelId, commentId }: ReportDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!selectedType) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار نوع الإبلاغ',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          post_id: postId,
          reel_id: reelId,
          comment_id: commentId,
          report_type: selectedType,
          report_reason: reportTypes.find(t => t.value === selectedType)?.label || '',
          additional_details: reason,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'تم الإبلاغ',
        description: 'شكراً لك، سيتم مراجعة البلاغ في أقرب وقت',
      });

      setOpen(false);
      setSelectedType('');
      setReason('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تقديم البلاغ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
          <Flag className="w-4 h-4 ml-2" />
          إبلاغ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>الإبلاغ عن المحتوى</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            يرجى اختيار سبب الإبلاغ عن هذا المحتوى
          </p>
          <RadioGroup value={selectedType} onValueChange={setSelectedType}>
            {reportTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label htmlFor={type.value} className="cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="reason">تفاصيل إضافية (اختياري)</Label>
            <Textarea
              id="reason"
              placeholder="أضف أي تفاصيل إضافية تساعدنا في المراجعة..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedType}>
            {loading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
