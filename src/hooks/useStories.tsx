import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
  };
}

interface GroupedStories {
  [userId: string]: {
    user: {
      id: string;
      username: string;
      avatar_url: string;
      full_name: string;
    };
    stories: Story[];
    hasViewed: boolean;
  };
}

export const useStories = (currentUserId?: string) => {
  const [stories, setStories] = useState<GroupedStories>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStories = async () => {
    try {
      // Get all non-expired stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!storiesData || storiesData.length === 0) {
        setStories({});
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(storiesData.map(story => story.user_id))];

      // Get profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Group stories by user
      const grouped: GroupedStories = {};
      
      storiesData.forEach(story => {
        const profile = profilesData?.find(p => p.id === story.user_id);
        
        if (!profile) return;

        if (!grouped[story.user_id]) {
          grouped[story.user_id] = {
            user: {
              id: profile.id,
              username: profile.username || 'مستخدم',
              avatar_url: profile.avatar_url || '/default-avatar.jpg',
              full_name: profile.full_name || 'مستخدم'
            },
            stories: [],
            hasViewed: false
          };
        }

        grouped[story.user_id].stories.push({
          ...story,
          profiles: grouped[story.user_id].user
        });
      });

      setStories(grouped);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stories, loading, reload: loadStories };
};
