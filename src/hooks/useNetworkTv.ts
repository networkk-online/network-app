import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TvProfile, TvVideo } from '@/lib/networkTv';

const db = supabase as any;
const PAGE_SIZE = 12;

const VIDEO_COLUMNS =
  'id,user_id,title,description,category,video_url,thumbnail_url,duration,views_count,likes_count,comments_count,shares_count,hashtags,language,visibility,allow_comments,allow_sharing,allow_embedding,is_published,scheduled_at,published_at,deleted_at,created_at,watch_seconds';

export async function attachUploaders(videos: TvVideo[]): Promise<TvVideo[]> {
  if (!videos.length) return videos;
  const ids = Array.from(new Set(videos.map((v) => v.user_id)));
  const { data } = await supabase
    .from('profiles')
    .select('id,username,full_name,avatar_url,is_verified,verification_type,account_type,is_live,followers_count,follower_count_override')
    .in('id', ids);
  const map = new Map<string, TvProfile>();
  (data || []).forEach((p: any) => map.set(p.id, p));
  return videos.map((v) => ({ ...v, uploader: map.get(v.user_id) || null }));
}

interface FeedOptions {
  category: string;
  search?: string;
  userId?: string | null;
}

/** Paginated Network TV feed with infinite loading. */
export function useTvFeed({ category, search, userId }: FeedOptions) {
  return useInfiniteQuery({
    queryKey: ['tv-feed', category, search || '', userId || ''],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      let q = db
        .from('videos')
        .select(VIDEO_COLUMNS)
        .eq('is_published', true)
        .is('deleted_at', null)
        .in('visibility', ['public', 'followers', 'subscribers'])
        .range(from, from + PAGE_SIZE - 1);

      if (search && search.trim()) {
        const term = search.trim().replace(/[%,]/g, '');
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      if (category === 'trending') q = q.order('views_count', { ascending: false });
      else if (category === 'creators') q = q.order('likes_count', { ascending: false });
      else {
        if (!['all', 'recent', 'live'].includes(category)) q = q.eq('category', category);
        q = q.order('created_at', { ascending: false });
      }

      const { data, error } = await q;
      if (error) throw error;
      return attachUploaders((data || []) as TvVideo[]);
    },
    getNextPageParam: (last: TvVideo[], all) => (last.length === PAGE_SIZE ? all.length : undefined),
    staleTime: 60_000,
  });
}

/** Vertical shorts rail — reuses the existing reels table. */
export function useTvShorts(limit = 12) {
  return useQuery({
    queryKey: ['tv-shorts', limit],
    queryFn: async () => {
      const { data } = await db
        .from('reels')
        .select('id,user_id,video_url,thumbnail_url,caption,views_count,likes_count,created_at')
        .eq('close_friends_only', false)
        .order('created_at', { ascending: false })
        .limit(limit);
      const rows = (data || []) as any[];
      if (!rows.length) return [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,is_verified,verification_type')
        .in('id', ids);
      const map = new Map<string, TvProfile>();
      (profs || []).forEach((p: any) => map.set(p.id, p));
      return rows.map((r) => ({ ...r, uploader: map.get(r.user_id) || null }));
    },
    staleTime: 120_000,
  });
}

/** Currently active live streams (reuses Live V3 backend). */
export function useTvLive(limit = 8) {
  return useQuery({
    queryKey: ['tv-live', limit],
    queryFn: async () => {
      const { data } = await db
        .from('live_streams')
        .select('*')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(limit);
      const rows = (data || []) as any[];
      if (!rows.length) return [];
      const ids = Array.from(new Set(rows.map((r) => r.host_id || r.user_id).filter(Boolean)));
      const { data: profs } = ids.length
        ? await supabase.from('profiles').select('id,username,full_name,avatar_url,is_verified,verification_type').in('id', ids)
        : { data: [] as any[] };
      const map = new Map<string, TvProfile>();
      (profs || []).forEach((p: any) => map.set(p.id, p));
      return rows.map((r) => ({ ...r, host: map.get(r.host_id || r.user_id) || null }));
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Single video for the watch page (RLS enforces visibility). */
export function useTvVideo(videoId?: string) {
  return useQuery({
    queryKey: ['tv-video', videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const { data, error } = await db.from('videos').select(VIDEO_COLUMNS).eq('id', videoId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [withUploader] = await attachUploaders([data as TvVideo]);
      return withUploader;
    },
  });
}

export function useTvRecommended(videoId?: string, category?: string | null) {
  return useQuery({
    queryKey: ['tv-recommended', videoId, category],
    enabled: !!videoId,
    queryFn: async () => {
      let q = db
        .from('videos')
        .select(VIDEO_COLUMNS)
        .eq('is_published', true)
        .is('deleted_at', null)
        .in('visibility', ['public', 'followers', 'subscribers'])
        .neq('id', videoId)
        .order('views_count', { ascending: false })
        .limit(14);
      if (category) q = q.eq('category', category);
      const { data } = await q;
      let rows = (data || []) as TvVideo[];
      if (rows.length < 6) {
        const { data: extra } = await db
          .from('videos')
          .select(VIDEO_COLUMNS)
          .eq('is_published', true)
          .is('deleted_at', null)
          .in('visibility', ['public', 'followers', 'subscribers'])
          .neq('id', videoId)
          .order('created_at', { ascending: false })
          .limit(14);
        const seen = new Set(rows.map((r) => r.id));
        rows = rows.concat(((extra || []) as TvVideo[]).filter((r) => !seen.has(r.id)));
      }
      return attachUploaders(rows.slice(0, 14));
    },
    staleTime: 60_000,
  });
}

export function useTvComments(videoId?: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['tv-comments', videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const { data } = await db
        .from('video_comments')
        .select('*')
        .eq('video_id', videoId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);
      const rows = (data || []) as any[];
      if (!rows.length) return [];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,is_verified,verification_type')
        .in('id', ids);
      const map = new Map<string, TvProfile>();
      (profs || []).forEach((p: any) => map.set(p.id, p));
      return rows.map((r) => ({ ...r, author: map.get(r.user_id) || null }));
    },
  });
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['tv-comments', videoId] }), [qc, videoId]);
  return { ...query, invalidate };
}

/** Current auth user id, resolved once. */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (alive) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return userId;
}

/** All videos owned by the signed-in creator (Creator Studio). */
export function useCreatorVideos(userId?: string | null) {
  return useQuery({
    queryKey: ['creator-videos', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await db
        .from('videos')
        .select(VIDEO_COLUMNS)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TvVideo[];
    },
    staleTime: 30_000,
  });
}

export interface CreatorStats {
  videos: number;
  views: number;
  likes: number;
  comments: number;
  watchSeconds: number;
  followers: number;
}

export function useCreatorStats(userId?: string | null) {
  const videosQuery = useCreatorVideos(userId);
  const profileQuery = useQuery({
    queryKey: ['creator-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,is_verified,verification_type,followers_count,follower_count_override,cover_url,bio')
        .eq('id', userId)
        .maybeSingle();
      return (data || null) as TvProfile | null;
    },
  });

  const stats: CreatorStats | null = useMemo(() => {
    const list = videosQuery.data;
    if (!list) return null;
    return {
      videos: list.length,
      views: list.reduce((s, v) => s + Number(v.views_count || 0), 0),
      likes: list.reduce((s, v) => s + Number(v.likes_count || 0), 0),
      comments: list.reduce((s, v) => s + Number(v.comments_count || 0), 0),
      watchSeconds: list.reduce((s, v) => s + Number(v.watch_seconds || 0), 0),
      followers: Number(profileQuery.data?.followers_count || 0),
    };
  }, [videosQuery.data, profileQuery.data]);

  return {
    stats,
    videos: videosQuery.data || [],
    profile: profileQuery.data || null,
    isLoading: videosQuery.isLoading || profileQuery.isLoading,
    refetch: videosQuery.refetch,
  };
}

/** Real view events for the creator's videos within a period (no fabricated data). */
export function useCreatorViewEvents(userId?: string | null, days?: number) {
  return useQuery({
    queryKey: ['creator-view-events', userId, days ?? 'lifetime'],
    enabled: !!userId,
    queryFn: async () => {
      const { data: mine } = await db.from('videos').select('id').eq('user_id', userId).is('deleted_at', null);
      const ids = ((mine || []) as any[]).map((r) => r.id);
      if (!ids.length) return [] as any[];
      let q = db.from('video_views').select('video_id,viewer_id,watch_seconds,device,country,created_at').in('video_id', ids).limit(5000);
      if (days) q = q.gte('created_at', new Date(Date.now() - days * 86400_000).toISOString());
      const { data } = await q;
      return (data || []) as any[];
    },
    staleTime: 60_000,
  });
}
