import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';

interface CreateHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
  storyId?: string;
  initialHighlight?: {
    id: string;
    title: string;
    cover_image?: string | null;
  } | null;
}

export const CreateHighlightDialog = ({ 
  open, 
  onOpenChange, 
  userId, 
  onSuccess,
  storyId,
  initialHighlight,
}: CreateHighlightDialogProps) => {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = Boolean(initialHighlight?.id);

  useEffect(() => {
    if (!open) return;
    setTitle(initialHighlight?.title || '');
    setCoverImage(null);
    setCoverPreview(initialHighlight?.cover_image || '');
  }, [open, initialHighlight?.id, initialHighlight?.title, initialHighlight?.cover_image]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async () => {
    if (!coverImage) return coverPreview || '';

    const fileExt = coverImage.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('stories')
      .upload(fileName, coverImage);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('stories')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان للهايلايت",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const coverImageUrl = await uploadCoverImage();

      if (isEditing && initialHighlight) {
        const { error: updateError } = await supabase
          .from('highlights')
          .update({
            title: title.trim(),
            cover_image: coverImageUrl || null,
          })
          .eq('id', initialHighlight.id)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        toast({
          title: "تم التعديل",
          description: "تم تحديث الهايلايت بنجاح",
        });

        onOpenChange(false);
        onSuccess?.();
        return;
      }

      // Create highlight
      const { data: highlight, error: highlightError } = await supabase
        .from('highlights')
        .insert({
          user_id: userId,
          title: title.trim(),
          cover_image: coverImageUrl || null,
        })
        .select()
        .single();

      if (highlightError) throw highlightError;

      // If storyId is provided, add it to the highlight
      if (storyId && highlight) {
        const { error: addStoryError } = await supabase
          .from('highlight_stories')
          .insert({
            highlight_id: highlight.id,
            story_id: storyId,
          });

        if (addStoryError) throw addStoryError;
      }

      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء الهايلايت بنجاح",
      });

      setTitle('');
      setCoverImage(null);
      setCoverPreview('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving highlight:', error);
      toast({
        title: "خطأ",
        description: isEditing ? "فشل تعديل الهايلايت" : "فشل إنشاء الهايلايت",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل الهايلايت' : 'إنشاء هايلايت جديد'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان الهايلايت</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ذكريات 2024"
              maxLength={50}
            />
          </div>

          <div>
            <Label>صورة الغلاف (اختياري)</Label>
            <div className="mt-2">
              {coverPreview ? (
                <div className="relative w-24 h-24 mx-auto">
                  <img 
                    src={coverPreview} 
                    alt="معاينة غلاف الهايلايت" 
                    className="w-full h-full object-cover rounded-full"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview('');
                    }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 mx-auto border-2 border-dashed border-border rounded-full cursor-pointer hover:bg-accent">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديل' : 'إنشاء'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};