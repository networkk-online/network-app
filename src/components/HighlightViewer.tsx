import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  story_type?: string;
  location?: string;
  music_title?: string;
  music_artist?: string;
  poll_question?: string;
  poll_options?: any;
  question_text?: string;
  sticker_data?: any;
  poll_votes?: any;
  allow_story_replies?: boolean;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface HighlightViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightId: string;
}

export const HighlightViewer = ({ 
  open, 
  onOpenChange, 
  highlightId 
}: HighlightViewerProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && highlightId) {
      fetchHighlightStories();
    }
  }, [open, highlightId]);

  const fetchHighlightStories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('highlight_stories')
        .select(`
          story_id,
          stories!inner (
            id,
            user_id,
            media_url,
            media_type,
            created_at,
            expires_at,
            views_count,
            story_type,
            location,
            music_title,
            music_artist,
            poll_question,
            poll_options,
            poll_votes,
            question_text,
            sticker_data,
            allow_story_replies,
            profiles!inner (
              username,
              avatar_url
            )
          )
        `)
        .eq('highlight_id', highlightId)
        .order('added_at', { ascending: true });

      if (error) throw error;

      const storiesData = data
        .map(item => {
          const story = item.stories as any;
          if (!story) return null;
          
          return {
            ...story,
            profiles: Array.isArray(story.profiles) ? story.profiles[0] : story.profiles
          };
        })
        .filter(story => story !== null) as Story[];

      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching highlight stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading || stories.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md bg-black border-none">
        <StoryViewer
          stories={stories}
          currentIndex={currentIndex}
          onClose={() => onOpenChange(false)}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </DialogContent>
    </Dialog>
  );
};