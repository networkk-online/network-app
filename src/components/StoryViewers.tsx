import { useStoryViews } from '@/hooks/useStoryViews';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, MessageCircle } from 'lucide-react';
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
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5" />
          <h3 className="font-semibold text-lg">
            {views.length}
          </h3>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-2">
          {views.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              لا توجد مشاهدات بعد
            </p>
          ) : (
            views.map((view) => (
              <div key={view.id} className="flex items-center gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-colors">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={view.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-gray-700">
                    {view.profiles?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {view.profiles?.username || 'user'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {view.profiles?.full_name || 'مستخدم'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
