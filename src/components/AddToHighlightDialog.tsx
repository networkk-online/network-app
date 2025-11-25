import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { CreateHighlightDialog } from './CreateHighlightDialog';
import { ScrollArea } from './ui/scroll-area';

interface Highlight {
  id: string;
  title: string;
  cover_image: string | null;
}

interface AddToHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  userId: string;
}

export const AddToHighlightDialog = ({ 
  open, 
  onOpenChange, 
  storyId,
  userId 
}: AddToHighlightDialogProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchHighlights();
    }
  }, [open, userId]);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('id, title, cover_image')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleAddToHighlight = async (highlightId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('highlight_stories')
        .insert({
          highlight_id: highlightId,
          story_id: storyId,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "تنبيه",
            description: "القصة موجودة بالفعل في هذا الهايلايت",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "تم الإضافة",
          description: "تمت إضافة القصة إلى الهايلايت",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error adding to highlight:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة القصة إلى الهايلايت",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle>إضافة إلى الهايلايت</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4" />
                إنشاء هايلايت جديد
              </Button>

              {highlights.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد هايلايتس بعد
                </p>
              ) : (
                highlights.map((highlight) => (
                  <Button
                    key={highlight.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => handleAddToHighlight(highlight.id)}
                    disabled={loading}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      {highlight.cover_image ? (
                        <img 
                          src={highlight.cover_image} 
                          alt={highlight.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {highlight.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-left">{highlight.title}</span>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateHighlightDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
        storyId={storyId}
        onSuccess={() => {
          fetchHighlights();
          onOpenChange(false);
        }}
      />
    </>
  );
};