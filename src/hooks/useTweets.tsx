import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  parent_id: string | null;
  quote_tweet_id: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  quoted_tweet?: Tweet | null;
}

const PAGE_SIZE = 20;

export const useTweets = (userId: string) => {
  const { toast } = useToast();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [likedTweets, setLikedTweets] = useState<string[]>([]);
  const [retweetedTweets, setRetweetedTweets] = useState<string[]>([]);
  const pageRef = useRef(0);

  const fetchTweets = useCallback(async (reset = false) => {
    try {
      const page = reset ? 0 : pageRef.current;
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('tweets')
        .select('*')
        .is('parent_id', null)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Fetch profiles for tweets
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((t: any) => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .in('id', userIds);

        const tweetsWithProfiles = data.map((t: any) => ({
          ...t,
          profile: profiles?.find(p => p.id === t.user_id) || null,
        }));

        if (reset) {
          setTweets(tweetsWithProfiles);
          pageRef.current = 1;
        } else {
          setTweets(prev => [...prev, ...tweetsWithProfiles]);
          pageRef.current = page + 1;
        }
        setHasMore(data.length === PAGE_SIZE);
      } else {
        if (reset) setTweets([]);
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching tweets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserInteractions = useCallback(async () => {
    if (!userId) return;
    const [{ data: likes }, { data: rts }] = await Promise.all([
      supabase.from('tweet_likes').select('tweet_id').eq('user_id', userId),
      supabase.from('tweet_retweets').select('tweet_id').eq('user_id', userId),
    ]);
    setLikedTweets(likes?.map(l => l.tweet_id) || []);
    setRetweetedTweets(rts?.map(r => r.tweet_id) || []);
  }, [userId]);

  const postTweet = useCallback(async (content: string, parentId?: string, quoteTweetId?: string) => {
    if (!userId || content.trim().length === 0) return false;

    // Duplicate-tweet guard: same text by same user within last 2 minutes → block
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('tweets')
      .select('id, content')
      .eq('user_id', userId)
      .gte('created_at', twoMinAgo)
      .order('created_at', { ascending: false })
      .limit(1);
    if (recent && recent[0]?.content?.trim() === content.trim()) {
      toast({ title: 'تغريدة مكررة', description: 'لقد نشرت نفس المحتوى للتو.', variant: 'destructive' });
      return false;
    }

    const { error } = await supabase.from('tweets').insert([{
      content: content.trim(),
      user_id: userId,
      parent_id: parentId || null,
      quote_tweet_id: quoteTweetId || null,
    }]);
    if (error) {
      toast({ title: 'خطأ', description: 'فشل في نشر التغريدة', variant: 'destructive' });
      return false;
    }
    return true;
  }, [userId, toast]);

  const toggleLike = useCallback(async (tweetId: string) => {
    if (!userId) return;
    const isLiked = likedTweets.includes(tweetId);
    
    // Optimistic update
    setLikedTweets(prev => isLiked ? prev.filter(id => id !== tweetId) : [...prev, tweetId]);
    setTweets(prev => prev.map(t => t.id === tweetId 
      ? { ...t, likes_count: t.likes_count + (isLiked ? -1 : 1) } : t));

    if (isLiked) {
      await supabase.from('tweet_likes').delete().eq('tweet_id', tweetId).eq('user_id', userId);
    } else {
      await supabase.from('tweet_likes').insert([{ tweet_id: tweetId, user_id: userId }]);
    }
  }, [userId, likedTweets]);

  const toggleRetweet = useCallback(async (tweetId: string) => {
    if (!userId) return;
    const isRetweeted = retweetedTweets.includes(tweetId);

    setRetweetedTweets(prev => isRetweeted ? prev.filter(id => id !== tweetId) : [...prev, tweetId]);
    setTweets(prev => prev.map(t => t.id === tweetId 
      ? { ...t, retweets_count: t.retweets_count + (isRetweeted ? -1 : 1) } : t));

    if (isRetweeted) {
      await supabase.from('tweet_retweets').delete().eq('tweet_id', tweetId).eq('user_id', userId);
    } else {
      await supabase.from('tweet_retweets').insert([{ tweet_id: tweetId, user_id: userId }]);
    }
  }, [userId, retweetedTweets]);

  const fetchReplies = useCallback(async (tweetId: string): Promise<Tweet[]> => {
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
      .eq('parent_id', tweetId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    const userIds = [...new Set(data.map((t: any) => t.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_verified')
      .in('id', userIds);

    return data.map((t: any) => ({
      ...t,
      profile: profiles?.find(p => p.id === t.user_id) || null,
    }));
  }, []);

  // Initial load
  useEffect(() => {
    fetchTweets(true);
    fetchUserInteractions();
  }, [fetchTweets, fetchUserInteractions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tweets-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tweets' }, async (payload) => {
        const newTweet = payload.new as any;
        if (newTweet.parent_id) return; // Skip replies in main feed

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_verified')
          .eq('id', newTweet.user_id)
          .single();

        setTweets(prev => [{
          ...newTweet,
          profile: profiles || null,
        }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    tweets, loading, hasMore, likedTweets, retweetedTweets,
    fetchMore: () => fetchTweets(false),
    postTweet, toggleLike, toggleRetweet, fetchReplies,
    refresh: () => fetchTweets(true),
  };
};
