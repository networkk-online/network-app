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
    is_verified?: boolean;
  };
}

interface GroupedStories {
  [userId: string]: {
    user: {
      id: string;
      username: string;
      avatar_url: string;
      full_name: string;
      is_verified?: boolean;
    };
    stories: Story[];
    hasViewed: boolean;
  };
}

export const useStories = (currentUserId?: string) => {
  const [stories, setStories] = useState<GroupedStories>({});
  const [loading, setLoading] = useState(true);
  const [viewedUsers, setViewedUsers] = useState<Set<string>>(new Set());

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
  }, [currentUserId]);

  const loadStories = async () => {
    try {
      // Get all non-expired stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

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
        .select('id, username, avatar_url, full_name, is_verified')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Get viewed stories for current user
      let viewedStoryIds: string[] = [];
      if (currentUserId) {
        const { data: viewsData } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('user_id', currentUserId);
        
        viewedStoryIds = viewsData?.map(v => v.story_id) || [];
      }

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
              full_name: profile.full_name || 'مستخدم',
              is_verified: profile.is_verified || false
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

      // Check if user has viewed all stories from each user
      Object.keys(grouped).forEach(userId => {
        const userStories = grouped[userId].stories;
        const allViewed = userStories.every(story => viewedStoryIds.includes(story.id));
        grouped[userId].hasViewed = allViewed || viewedUsers.has(userId);
      });

      setStories(grouped);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStoryAsViewed = async (storyId: string, storyUserId: string) => {
    // Save view to database
    if (currentUserId) {
      try {
        await supabase
          .from('story_views')
          .upsert(
            { user_id: currentUserId, story_id: storyId },
            { onConflict: 'user_id,story_id', ignoreDuplicates: true }
          );
      } catch (error) {
        console.error('Error saving story view:', error);
      }
    }
  };

  const markUserStoriesAsViewed = async (userId: string) => {
    // Update local state immediately
    setViewedUsers(prev => new Set([...prev, userId]));
    setStories(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        hasViewed: true
      }
    }));

    // Save views to database
    if (currentUserId && stories[userId]) {
      const storyIds = stories[userId].stories.map(s => s.id);
      if (storyIds.length > 0) {
        try {
          await supabase
            .from('story_views')
            .upsert(
              storyIds.map(storyId => ({ user_id: currentUserId, story_id: storyId })),
              { onConflict: 'user_id,story_id', ignoreDuplicates: true }
            );
        } catch (error) {
          console.error('Error saving story views:', error);
        }
      }
    }
  };

  return { stories, loading, reload: loadStories, markUserStoriesAsViewed, markStoryAsViewed };
};
