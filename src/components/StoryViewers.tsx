import { useStoryViews } from '@/hooks/useStoryViews';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface StoryViewersProps {
  storyId: string;
}

export const StoryViewers = ({ storyId }: StoryViewersProps) => {
  const { views, loading } = useStoryViews(storyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 border-b">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">
          المشاهدات ({views.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-3 p-4">
          {views.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد مشاهدات بعد
            </p>
          ) : (
            views.map((view) => (
              <div key={view.id} className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={view.profiles?.avatar_url || ''} />
                  <AvatarFallback>
                    {view.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {view.profiles?.full_name || view.profiles?.username || 'مستخدم'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{view.profiles?.username || 'user'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(view.viewed_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
