import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted: () => void;
}

type DocType = 'national_id' | 'passport';

const VerificationRequestDialog = ({ open, onOpenChange, onSubmitted }: Props) => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [docType, setDocType] = useState<DocType>('national_id');
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fullName.trim().length >= 2 && !!file && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const ext = (file!.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/id_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('verification-documents')
        .upload(path, file!, { contentType: file!.type, upsert: true });
      if (upErr) throw upErr;

      const docLabel = docType === 'national_id' ? 'البطاقة الوطنية / الهوية' : 'جواز السفر';
      const reason = `نوع الوثيقة: ${docLabel}${note.trim() ? `\n\nملاحظات:\n${note.trim()}` : ''}`;

      const { error } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        full_name: fullName.trim(),
        account_type: 'personal',
        id_document_url: path,
        reason,
        status: 'pending',
      });
      if (error) throw error;

      toast({ title: 'تم إرسال الطلب', description: 'سيقوم فريق الإدارة بمراجعة طلبك قريباً.' });
      onSubmitted();
      onOpenChange(false);
      setFullName(''); setFile(null); setNote(''); setDocType('national_id');
    } catch (e: any) {
      toast({ title: 'فشل الإرسال', description: e.message || 'حدث خطأ', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md bg-neutral-950 border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">طلب التوثيق</DialogTitle>
          </div>
          <p className="text-xs text-white/60 pt-1">
            أرسل معلوماتك ووثيقة هويتك الرسمية للحصول على الشارة الموثقة.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-1.5 block text-sm">الاسم الكامل</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="كما هو مكتوب في الهوية الرسمية"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">نوع الوثيقة</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10 text-white">
                <SelectItem value="national_id">البطاقة الوطنية / الهوية</SelectItem>
                <SelectItem value="passport">جواز السفر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">رفع صورة الوثيقة</Label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className={`rounded-xl border border-dashed p-4 text-center transition ${
                file ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-white/15 hover:border-white/30 bg-white/[0.02]'
              }`}>
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="truncate max-w-[220px]">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mx-auto mb-1 text-white/60" />
                    <p className="text-xs text-white/60">اضغط لاختيار صورة واضحة للوثيقة</p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">معلومات إضافية (اختياري)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="نبذة عنك أو روابط حساباتك على منصات أخرى تدعم طلبك"
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-11 font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال الطلب'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequestDialog;
