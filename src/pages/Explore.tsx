import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search as SearchIcon, User, TrendingUp, Hash, Film, Play, Radio, Grid3X3, Users as UsersIcon, Crown, Gamepad2, Cpu, Music, Trophy, Palette, Sparkles, Check, Plus, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import SeoHead from '@/components/seo/SeoHead';
import { toast } from 'sonner';


// Escape select() literals so supabase-js does not do heavy type-parsing
const sel = (s: string): string => s;

interface ProfileLite {
  id: string;
  username: string | null;
  full_name?: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_live?: boolean | null;
  followers_count?: number | null;
  account_type?: string | null;
}

interface PostRow {
  id: string;
  content: string | null;
  media_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  user_id: string;
}
interface ReelRow {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  duration: number | null;
  user_id: string;
  created_at: string;
}
interface LiveRow {
  id: string;
  host_id: string;
  channel_name: string;
  title: string | null;
  viewer_count: number | null;
  status: string;
}

type FeedItem =
  | { kind: 'post'; data: PostRow & { profile?: ProfileLite } }
  | { kind: 'reel'; data: ReelRow & { profile?: ProfileLite } };

type Chip = { id: string; label: string; icon: any };

const CHIPS: Chip[] = [
  { id: 'all', label: 'الكل', icon: Sparkles },
  { id: 'reels', label: 'ريلز', icon: Film },
  { id: 'posts', label: 'منشورات', icon: Grid3X3 },
  { id: 'people', label: 'أشخاص', icon: UsersIcon },
  { id: 'live', label: 'بث مباشر', icon: Radio },
  { id: 'trending', label: 'الأكثر رواجاً', icon: TrendingUp },
  { id: 'gaming', label: 'ألعاب', icon: Gamepad2 },
  { id: 'tech', label: 'تكنولوجيا', icon: Cpu },
  { id: 'music', label: 'موسيقى', icon: Music },
  { id: 'sports', label: 'رياضة', icon: Trophy },
  { id: 'art', label: 'فن', icon: Palette },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  gaming: ['gaming', 'game', 'ألعاب', 'لعبة', 'pubg', 'fifa'],
  tech: ['tech', 'تكنولوجيا', 'برمجة', 'code', 'ai', 'ذكاء'],
  music: ['music', 'موسيقى', 'أغنية', 'song', 'اغنية'],
  sports: ['sport', 'رياضة', 'كرة', 'football', 'كأس'],
  art: ['art', 'فن', 'رسم', 'draw', 'design'],
};

const PAGE_SIZE = 24;

// Extract #hashtags from text
const extractTags = (t: string | null | undefined): string[] => {
  if (!t) return [];
  const m = t.match(/#[\p{L}0-9_]+/gu);
  return m ? m.map((s) => s.toLowerCase()) : [];
};

const formatCount = (n: number | null | undefined): string => {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
};

const isVideoUrl = (u: string | null | undefined): boolean =>
  !!u && /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(u);

const Explore = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id } : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ? { id: s.user.id } : null));
    return () => sub.subscription.unsubscribe();
  }, []);


  const [chip, setChip] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [rails, setRails] = useState<{
    users: ProfileLite[];
    lives: (LiveRow & { profile?: ProfileLite })[];
    hashtags: { tag: string; count: number }[];
    vipMap: Map<string, string>;
  }>({ users: [], lives: [], hashtags: [], vipMap: new Map() });
  const [railsLoading, setRailsLoading] = useState(true);

  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [followBusy, setFollowBusy] = useState<Set<string>>(new Set());

  const [posts, setPosts] = useState<(PostRow & { profile?: ProfileLite })[]>([]);
  const [reels, setReels] = useState<(ReelRow & { profile?: ProfileLite })[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef({ post: 0, reel: 0 });

  const [search, setSearch] = useState<{
    users: ProfileLite[];
    posts: (PostRow & { profile?: ProfileLite })[];
    reels: (ReelRow & { profile?: ProfileLite })[];
    lives: (LiveRow & { profile?: ProfileLite })[];
    hashtags: { tag: string; count: number }[];
    running: boolean;
  }>({ users: [], posts: [], reels: [], lives: [], hashtags: [], running: false });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ─── Load rails (users / lives / hashtags / VIP) ────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRailsLoading(true);
      try {
        // Top public users (exclude banned/suspended)
        const usersRes = await supabase
          .from('profiles')
          .select(sel('id, username, full_name, avatar_url, is_verified, is_live, followers_count, account_type'))
          .eq('is_banned', false)
          .eq('is_suspended', false)
          .order('followers_count', { ascending: false, nullsFirst: false })
          .limit(20)
          .returns<ProfileLite[]>();

        // Live streams (active)
        const livesRes = await supabase
          .from('live_streams')
          .select(sel('id, host_id, channel_name, title, viewer_count, status'))
          .eq('status', 'live')
          .gt('last_heartbeat_at', new Date(Date.now() - 90_000).toISOString())
          .order('viewer_count', { ascending: false, nullsFirst: false })
          .limit(12)
          .returns<LiveRow[]>();

        // Recent posts for hashtag mining
        const tagPostsRes = await supabase
          .from('posts')
          .select(sel('content'))
          .order('created_at', { ascending: false })
          .limit(200)
          .returns<{ content: string | null }[]>();

        const users = usersRes.data ?? [];
        const lives = livesRes.data ?? [];

        // Attach profiles to lives
        const hostIds = [...new Set(lives.map((l) => l.host_id))];
        let hostProfiles: ProfileLite[] = [];
        if (hostIds.length) {
          const { data } = await supabase
            .from('profiles')
            .select(sel('id, username, full_name, avatar_url, is_verified, is_live, followers_count, account_type'))
            .in('id', hostIds)
            .returns<ProfileLite[]>();
          hostProfiles = data ?? [];
        }
        const hostMap = new Map(hostProfiles.map((p) => [p.id, p]));
        const livesEnriched = lives.map((l) => ({ ...l, profile: hostMap.get(l.host_id) }));

        // VIP for rail users + hosts
        const vipIds = [...new Set([...users.map((u) => u.id), ...hostIds])];
        let vipMap = new Map<string, string>();
        if (vipIds.length) {
          const { data } = await supabase
            .from('live_vip_levels')
            .select(sel('user_id, tier'))
            .in('user_id', vipIds)
            .returns<{ user_id: string; tier: string }[]>();
          vipMap = new Map((data ?? []).filter((v) => v.tier && v.tier !== 'none').map((v) => [v.user_id, v.tier]));
        }

        // Hashtags tally
        const tally = new Map<string, number>();
        (tagPostsRes.data ?? []).forEach((row) => {
          extractTags(row.content).forEach((t) => tally.set(t, (tally.get(t) ?? 0) + 1));
        });
        const hashtags = Array.from(tally.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        if (!cancelled) setRails({ users, lives: livesEnriched, hashtags, vipMap });
      } catch (e) {
        console.error('Explore rails error', e);
      } finally {
        if (!cancelled) setRailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Load current user's follows ────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('follows')
        .select(sel('following_id'))
        .eq('follower_id', user.id)
        .returns<{ following_id: string }[]>();
      if (!cancelled) setFollowingSet(new Set((data ?? []).map((r) => r.following_id)));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ─── Feed loaders ───────────────────────────────────────────────
  const enrichProfiles = useCallback(
    async <T extends { user_id: string }>(rows: T[]): Promise<(T & { profile?: ProfileLite })[]> => {
      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (!ids.length) return rows;
      const { data } = await supabase
        .from('profiles')
        .select(sel('id, username, full_name, avatar_url, is_verified, is_live, followers_count, account_type'))
        .in('id', ids)
        .returns<ProfileLite[]>();
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) }));
    },
    []
  );

  const loadPosts = useCallback(
    async (offset: number): Promise<(PostRow & { profile?: ProfileLite })[]> => {
      let sortCol: string = 'created_at';
      if (chip === 'trending') sortCol = 'likes_count';
      const { data } = await supabase
        .from('posts')
        .select(sel('id, content, media_url, likes_count, comments_count, created_at, user_id'))
        .order(sortCol, { ascending: false, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1)
        .returns<PostRow[]>();
      let rows = data ?? [];
      const kw = CATEGORY_KEYWORDS[chip];
      if (kw) {
        rows = rows.filter((r) => {
          const t = (r.content ?? '').toLowerCase();
          return kw.some((k) => t.includes(k));
        });
      }
      return enrichProfiles(rows);
    },
    [chip, enrichProfiles]
  );

  const loadReels = useCallback(
    async (offset: number): Promise<(ReelRow & { profile?: ProfileLite })[]> => {
      let sortCol: string = 'created_at';
      if (chip === 'trending') sortCol = 'views_count';
      const { data } = await supabase
        .from('reels')
        .select(sel('id, video_url, thumbnail_url, caption, likes_count, comments_count, views_count, duration, user_id, created_at'))
        .order(sortCol, { ascending: false, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1)
        .returns<ReelRow[]>();
      let rows = data ?? [];
      const kw = CATEGORY_KEYWORDS[chip];
      if (kw) {
        rows = rows.filter((r) => {
          const t = (r.caption ?? '').toLowerCase();
          return kw.some((k) => t.includes(k));
        });
      }
      return enrichProfiles(rows);
    },
    [chip, enrichProfiles]
  );

  const resetFeed = useCallback(async () => {
    setFeedLoading(true);
    offsetRef.current = { post: 0, reel: 0 };
    try {
      const wantPosts = chip !== 'reels' && chip !== 'people' && chip !== 'live';
      const wantReels = chip === 'all' || chip === 'reels' || chip === 'trending' || !!CATEGORY_KEYWORDS[chip];
      const [p, r] = await Promise.all([
        wantPosts ? loadPosts(0) : Promise.resolve([]),
        wantReels ? loadReels(0) : Promise.resolve([]),
      ]);
      setPosts(p);
      setReels(r);
      offsetRef.current = { post: p.length, reel: r.length };
      setHasMore((p.length + r.length) >= 8);
    } catch (e) {
      console.error('resetFeed', e);
    } finally {
      setFeedLoading(false);
    }
  }, [chip, loadPosts, loadReels]);

  useEffect(() => {
    resetFeed();
  }, [resetFeed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const wantPosts = chip !== 'reels' && chip !== 'people' && chip !== 'live';
      const wantReels = chip === 'all' || chip === 'reels' || chip === 'trending' || !!CATEGORY_KEYWORDS[chip];
      const [p, r] = await Promise.all([
        wantPosts ? loadPosts(offsetRef.current.post) : Promise.resolve([]),
        wantReels ? loadReels(offsetRef.current.reel) : Promise.resolve([]),
      ]);
      setPosts((prev) => [...prev, ...p]);
      setReels((prev) => [...prev, ...r]);
      offsetRef.current = { post: offsetRef.current.post + p.length, reel: offsetRef.current.reel + r.length };
      if (p.length + r.length < 8) setHasMore(false);
    } catch (e) {
      console.error('loadMore', e);
    } finally {
      setLoadingMore(false);
    }
  }, [chip, hasMore, loadingMore, loadPosts, loadReels]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // ─── Mixed algorithm: 2 posts, 1 reel, 1 user, 1 live, repeat ───
  const mixedFeed = useMemo<Array<
    | { kind: 'post'; data: PostRow & { profile?: ProfileLite } }
    | { kind: 'reel'; data: ReelRow & { profile?: ProfileLite } }
    | { kind: 'user'; data: ProfileLite }
    | { kind: 'live'; data: LiveRow & { profile?: ProfileLite } }
  >>(() => {
    if (chip === 'reels') return reels.map((r) => ({ kind: 'reel' as const, data: r }));
    if (chip === 'posts') return posts.map((p) => ({ kind: 'post' as const, data: p }));
    if (chip === 'people') return rails.users.map((u) => ({ kind: 'user' as const, data: u }));
    if (chip === 'live') return rails.lives.map((l) => ({ kind: 'live' as const, data: l }));

    const out: any[] = [];
    let pi = 0, ri = 0, ui = 0, li = 0;
    const users = rails.users;
    const lives = rails.lives;
    while (pi < posts.length || ri < reels.length) {
      // 2 posts
      for (let k = 0; k < 2 && pi < posts.length; k++, pi++) out.push({ kind: 'post', data: posts[pi] });
      // 1 reel
      if (ri < reels.length) out.push({ kind: 'reel', data: reels[ri++] });
      // 1 user (light sprinkle only in "all")
      if (chip === 'all' && ui < users.length && out.length % 8 === 0) {
        out.push({ kind: 'user', data: users[ui++] });
      }
      // 1 live (rare, only when available)
      if (chip === 'all' && li < lives.length && out.length % 12 === 0) {
        out.push({ kind: 'live', data: lives[li++] });
      }
    }
    return out;
  }, [chip, posts, reels, rails.users, rails.lives]);

  // ─── Search (real-time debounced) ───────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearch({ users: [], posts: [], reels: [], lives: [], hashtags: [], running: false });
      return;
    }
    const controller = { cancelled: false };
    const timer = window.setTimeout(async () => {
      setSearch((s) => ({ ...s, running: true }));
      const like = `%${q.replace(/[%_]/g, '')}%`;
      const isTag = q.startsWith('#');
      const bare = isTag ? q.slice(1) : q;
      try {
        const [uRes, pRes, rRes, lRes] = await Promise.all([
          supabase
            .from('profiles')
            .select(sel('id, username, full_name, avatar_url, is_verified, is_live, followers_count, account_type'))
            .or(`username.ilike.${like},full_name.ilike.${like}`)
            .order('followers_count', { ascending: false, nullsFirst: false })
            .limit(15)
            .returns<ProfileLite[]>(),
          supabase
            .from('posts')
            .select(sel('id, content, media_url, likes_count, comments_count, created_at, user_id'))
            .ilike('content', `%${bare}%`)
            .order('created_at', { ascending: false })
            .limit(15)
            .returns<PostRow[]>(),
          supabase
            .from('reels')
            .select(sel('id, video_url, thumbnail_url, caption, likes_count, comments_count, views_count, duration, user_id, created_at'))
            .ilike('caption', `%${bare}%`)
            .order('created_at', { ascending: false })
            .limit(15)
            .returns<ReelRow[]>(),
          supabase
            .from('live_streams')
            .select(sel('id, host_id, channel_name, title, viewer_count, status'))
            .eq('status', 'live')
            .ilike('title', `%${bare}%`)
            .limit(10)
            .returns<LiveRow[]>(),
        ]);
        if (controller.cancelled) return;
        const [enrichedPosts, enrichedReels, enrichedLives] = await Promise.all([
          enrichProfiles(pRes.data ?? []),
          enrichProfiles(rRes.data ?? []),
          (async () => {
            const rows = lRes.data ?? [];
            const ids = [...new Set(rows.map((l) => l.host_id))];
            if (!ids.length) return rows;
            const { data } = await supabase
              .from('profiles')
              .select(sel('id, username, full_name, avatar_url, is_verified, is_live, followers_count, account_type'))
              .in('id', ids)
              .returns<ProfileLite[]>();
            const m = new Map((data ?? []).map((p) => [p.id, p]));
            return rows.map((l) => ({ ...l, profile: m.get(l.host_id) }));
          })(),
        ]);
        // Hashtags from rails filtered by query
        const hashtagMatches = rails.hashtags.filter((h) => h.tag.includes(bare.toLowerCase())).slice(0, 8);
        if (controller.cancelled) return;
        setSearch({
          users: uRes.data ?? [],
          posts: enrichedPosts,
          reels: enrichedReels,
          lives: enrichedLives,
          hashtags: hashtagMatches,
          running: false,
        });
      } catch (e) {
        if (!controller.cancelled) setSearch((s) => ({ ...s, running: false }));
      }
    }, 300);
    return () => {
      controller.cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, enrichProfiles, rails.hashtags]);

  // ─── Follow toggle ──────────────────────────────────────────────
  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!user?.id) {
        toast.error('يرجى تسجيل الدخول أولاً');
        return;
      }
      if (targetId === user.id) return;
      if (followBusy.has(targetId)) return;
      setFollowBusy((s) => new Set(s).add(targetId));
      const isFollowing = followingSet.has(targetId);
      // Optimistic
      setFollowingSet((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.delete(targetId); else next.add(targetId);
        return next;
      });
      try {
        if (isFollowing) {
          await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
        } else {
          await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
        }
      } catch (e) {
        // Rollback
        setFollowingSet((prev) => {
          const next = new Set(prev);
          if (isFollowing) next.add(targetId); else next.delete(targetId);
          return next;
        });
        toast.error('تعذر تحديث المتابعة');
      } finally {
        setFollowBusy((s) => {
          const n = new Set(s);
          n.delete(targetId);
          return n;
        });
      }
    },
    [user?.id, followingSet, followBusy]
  );

  const showSearchResults = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-black">
      <SeoHead route="/explore" />

      {/* ─── Sticky header ─── */}
      <div className="sticky top-0 z-50 bg-black/85 backdrop-blur-[35px] border-b-[0.5px] border-white/[0.08]">
        <div className="px-4 pt-3 pb-2 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-lg font-bold tracking-tight">استكشاف</h1>
            <span className="text-white/30 text-[10px] tracking-widest">networkk.online</span>
          </div>

          <div className="relative mb-2">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" strokeWidth={1.4} />
            <input
              type="text"
              placeholder="ابحث عن مستخدمين، منشورات، ريلز، هاشتاقات..."
              aria-label="Search Explore"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-white/[0.06] backdrop-blur-[25px] border-[0.5px] border-white/[0.15] rounded-xl pr-10 pl-4 text-sm text-white placeholder-white/25 outline-none focus:border-primary/40 transition-all"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {CHIPS.map((c) => {
              const active = chip === c.id;
              const Icon = c.icon;
              return (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setChip(c.id)}
                  className={`flex items-center gap-1 px-3 h-8 rounded-lg whitespace-nowrap text-[11px] font-medium border-[0.5px] transition-all shrink-0 ${
                    active
                      ? 'bg-white/[0.12] border-primary/30 text-primary shadow-[0_0_12px_hsla(144,90%,33%,0.15)]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/50'
                  }`}
                >
                  <Icon className="w-3 h-3" strokeWidth={1.6} />
                  {c.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Search overlay ─── */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 py-3 space-y-4 max-w-6xl mx-auto"
          >
            {search.running && (
              <div className="text-center text-white/30 text-sm py-6">جاري البحث...</div>
            )}
            {!search.running && !search.users.length && !search.posts.length && !search.reels.length && !search.lives.length && !search.hashtags.length && (
              <div className="text-center text-white/30 text-sm py-10">لا توجد نتائج</div>
            )}
            {search.hashtags.length > 0 && (
              <Section title="هاشتاقات">
                <div className="flex flex-wrap gap-2">
                  {search.hashtags.map((h) => (
                    <button
                      key={h.tag}
                      onClick={() => setSearchQuery(h.tag)}
                      className="flex items-center gap-1 px-3 h-8 rounded-full bg-white/[0.05] border-[0.5px] border-white/10 text-white/80 text-xs"
                    >
                      <Hash className="w-3 h-3" /> {h.tag.replace('#', '')}
                      <span className="text-white/40 mr-1">{formatCount(h.count)}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}
            {search.users.length > 0 && (
              <Section title="أشخاص">
                <div className="space-y-1">
                  {search.users.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      vipTier={rails.vipMap.get(u.id)}
                      isFollowing={followingSet.has(u.id)}
                      isSelf={user?.id === u.id}
                      busy={followBusy.has(u.id)}
                      onFollow={() => toggleFollow(u.id)}
                      onOpen={() => navigate(`/profile/${u.id}`)}
                    />
                  ))}
                </div>
              </Section>
            )}
            {search.lives.length > 0 && (
              <Section title="بث مباشر">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {search.lives.map((l) => (
                    <LiveCard key={l.id} live={l} vipTier={rails.vipMap.get(l.host_id)} onJoin={() => navigate(`/broadcast?join=${l.id}`)} />
                  ))}
                </div>
              </Section>
            )}
            {search.reels.length > 0 && (
              <Section title="ريلز">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-[2px]">
                  {search.reels.map((r) => (
                    <ReelTile key={r.id} reel={r} onOpen={() => navigate(`/shorts?id=${r.id}`)} />
                  ))}
                </div>
              </Section>
            )}
            {search.posts.length > 0 && (
              <Section title="منشورات">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-[2px]">
                  {search.posts.map((p) => (
                    <PostTile key={p.id} post={p} onOpen={() => navigate(`/explore/feed/${p.id}`)} />
                  ))}
                </div>
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main content ─── */}
      {!showSearchResults && (
        <main className="pb-24 max-w-6xl mx-auto">
          {/* Users rail — horizontal scroll */}
          {(chip === 'all' || chip === 'people') && (
            <section className="pt-3 pb-2">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-primary" />
                  مبدعون
                </h2>
                {chip !== 'people' && (
                  <button onClick={() => setChip('people')} className="text-primary text-[11px]">عرض الكل</button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
                {railsLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="w-28 h-40 shrink-0 rounded-2xl bg-white/[0.04]" />
                    ))
                  : rails.users.map((u) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        vipTier={rails.vipMap.get(u.id)}
                        isFollowing={followingSet.has(u.id)}
                        isSelf={user?.id === u.id}
                        busy={followBusy.has(u.id)}
                        onOpen={() => navigate(`/profile/${u.id}`)}
                        onFollow={() => toggleFollow(u.id)}
                      />
                    ))}
              </div>
            </section>
          )}

          {/* Live rail */}
          {(chip === 'all' || chip === 'live') && rails.lives.length > 0 && (
            <section className="pt-3 pb-3">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  بث مباشر الآن
                </h2>
              </div>
              <div className={chip === 'live'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-4'
                : 'flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1'}>
                {rails.lives.map((l) => (
                  <div key={l.id} className={chip === 'live' ? '' : 'w-56 shrink-0'}>
                    <LiveCard live={l} vipTier={rails.vipMap.get(l.host_id)} onJoin={() => navigate(`/broadcast?join=${l.id}`)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trending hashtags rail */}
          {(chip === 'all' || chip === 'trending') && rails.hashtags.length > 0 && (
            <section className="pt-2 pb-3">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-primary" />
                  هاشتاقات رائجة
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
                {rails.hashtags.map((h) => (
                  <button
                    key={h.tag}
                    onClick={() => setSearchQuery(h.tag)}
                    className="flex items-center gap-1 px-3 h-8 rounded-full bg-white/[0.05] border-[0.5px] border-white/10 text-white/80 text-xs shrink-0"
                  >
                    <Hash className="w-3 h-3" /> {h.tag.replace('#', '')}
                    <span className="text-white/40 mr-1">{formatCount(h.count)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ─── Mixed discovery grid ─── */}
          {chip === 'people' ? (
            <section className="px-4 pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {rails.users.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  vipTier={rails.vipMap.get(u.id)}
                  isFollowing={followingSet.has(u.id)}
                  isSelf={user?.id === u.id}
                  busy={followBusy.has(u.id)}
                  onOpen={() => navigate(`/profile/${u.id}`)}
                  onFollow={() => toggleFollow(u.id)}
                  wide
                />
              ))}
            </section>
          ) : chip === 'live' ? null : (
            <section className="pt-2">
              {feedLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[2px]">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square bg-white/[0.04]" />
                  ))}
                </div>
              ) : mixedFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Grid3X3 className="w-12 h-12 text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">لا يوجد محتوى بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[2px]">
                  {mixedFeed.map((it, i) => {
                    if (it.kind === 'post')
                      return <PostTile key={`p-${it.data.id}`} post={it.data} onOpen={() => navigate(`/explore/feed/${it.data.id}?idx=${i}`)} vipTier={rails.vipMap.get(it.data.user_id)} />;
                    if (it.kind === 'reel')
                      return <ReelTile key={`r-${it.data.id}`} reel={it.data} onOpen={() => navigate(`/shorts?id=${it.data.id}`)} vipTier={rails.vipMap.get(it.data.user_id)} />;
                    if (it.kind === 'user')
                      return (
                        <UserTile
                          key={`u-${it.data.id}`}
                          user={it.data}
                          vipTier={rails.vipMap.get(it.data.id)}
                          isFollowing={followingSet.has(it.data.id)}
                          isSelf={user?.id === it.data.id}
                          busy={followBusy.has(it.data.id)}
                          onOpen={() => navigate(`/profile/${it.data.id}`)}
                          onFollow={() => toggleFollow(it.data.id)}
                        />
                      );
                    if (it.kind === 'live')
                      return <LiveTile key={`l-${it.data.id}`} live={it.data} vipTier={rails.vipMap.get(it.data.host_id)} onJoin={() => navigate(`/broadcast?join=${it.data.id}`)} />;
                    return null;
                  })}
                </div>
              )}
            </section>
          )}

          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </main>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Sub-components (memoized where useful)
// ═══════════════════════════════════════════════════════════════

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-white/80 text-xs font-semibold mb-2 px-1">{title}</h3>
    {children}
  </div>
);

const VipChip = ({ tier }: { tier?: string }) => {
  if (!tier || tier === 'none') return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 h-4 rounded-full bg-amber-500/20 border-[0.5px] border-amber-400/40 text-amber-300 text-[9px] font-bold uppercase">
      <Crown className="w-2.5 h-2.5" /> {tier}
    </span>
  );
};

const OnlineDot = ({ online }: { online?: boolean | null }) =>
  online ? (
    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
  ) : null;

const FollowBtn = ({
  isFollowing,
  isSelf,
  busy,
  onClick,
  compact,
}: {
  isFollowing: boolean;
  isSelf: boolean;
  busy: boolean;
  onClick: (e: React.MouseEvent) => void;
  compact?: boolean;
}) => {
  if (isSelf) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={busy}
      className={`${compact ? 'h-6 px-2 text-[10px]' : 'h-7 px-3 text-[11px]'} rounded-full font-semibold flex items-center gap-1 border-[0.5px] transition-all ${
        isFollowing
          ? 'bg-white/[0.06] border-white/15 text-white/70'
          : 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsla(144,90%,33%,0.35)]'
      } disabled:opacity-50`}
    >
      {isFollowing ? <><Check className="w-3 h-3" /> يتابع</> : <><Plus className="w-3 h-3" /> متابعة</>}
    </button>
  );
};

const UserCard = ({
  user,
  vipTier,
  isFollowing,
  isSelf,
  busy,
  onOpen,
  onFollow,
  wide,
}: {
  user: ProfileLite;
  vipTier?: string;
  isFollowing: boolean;
  isSelf: boolean;
  busy: boolean;
  onOpen: () => void;
  onFollow: () => void;
  wide?: boolean;
}) => {
  const isBusiness = user.account_type === 'business' || user.account_type === 'government';
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className={`${wide ? '' : 'w-28 shrink-0'} flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04] border-[0.5px] border-white/[0.08] cursor-pointer`}
    >
      <div className="relative">
        <Avatar className={`${isBusiness ? 'rounded-2xl' : 'rounded-full'} w-14 h-14 ${user.is_live ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-black' : ''}`}>
          <AvatarImage src={user.avatar_url ?? undefined} className={isBusiness ? 'rounded-2xl' : ''} />
          <AvatarFallback className="bg-white/5">
            <User className="w-5 h-5 text-white/40" />
          </AvatarFallback>
        </Avatar>
        <OnlineDot online={user.is_live} />
        {user.is_live && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold uppercase tracking-wider">
            Live
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 max-w-full">
        <span className="text-white text-[11px] font-semibold truncate max-w-[80px]">@{user.username ?? 'user'}</span>
        {user.is_verified && <VerifiedBadge size="sm" />}
      </div>
      <VipChip tier={vipTier} />
      <span className="text-white/40 text-[9px]">{formatCount(user.followers_count)} متابع</span>
      <FollowBtn isFollowing={isFollowing} isSelf={isSelf} busy={busy} onClick={onFollow} compact />
    </motion.div>
  );
};

const UserRow = ({
  user,
  vipTier,
  isFollowing,
  isSelf,
  busy,
  onFollow,
  onOpen,
}: {
  user: ProfileLite;
  vipTier?: string;
  isFollowing: boolean;
  isSelf: boolean;
  busy: boolean;
  onFollow: () => void;
  onOpen: () => void;
}) => {
  const isBusiness = user.account_type === 'business' || user.account_type === 'government';
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border-[0.5px] border-white/[0.08] cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="relative">
        <Avatar className={`${isBusiness ? 'rounded-2xl' : 'rounded-full'} w-10 h-10`}>
          <AvatarImage src={user.avatar_url ?? undefined} className={isBusiness ? 'rounded-2xl' : ''} />
          <AvatarFallback className="bg-white/5"><User className="w-4 h-4 text-white/40" /></AvatarFallback>
        </Avatar>
        <OnlineDot online={user.is_live} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-white text-sm font-medium truncate">{user.full_name || user.username || 'user'}</span>
          {user.is_verified && <VerifiedBadge size="sm" />}
          <VipChip tier={vipTier} />
        </div>
        <span className="text-white/40 text-xs">@{user.username ?? 'user'} · {formatCount(user.followers_count)} متابع</span>
      </div>
      <FollowBtn isFollowing={isFollowing} isSelf={isSelf} busy={busy} onClick={onFollow} />
    </div>
  );
};

const UserTile = ({
  user,
  vipTier,
  isFollowing,
  isSelf,
  busy,
  onOpen,
  onFollow,
}: {
  user: ProfileLite;
  vipTier?: string;
  isFollowing: boolean;
  isSelf: boolean;
  busy: boolean;
  onOpen: () => void;
  onFollow: () => void;
}) => {
  const isBusiness = user.account_type === 'business' || user.account_type === 'government';
  return (
    <div
      onClick={onOpen}
      className="relative aspect-square bg-gradient-to-br from-primary/20 via-white/[0.03] to-black flex flex-col items-center justify-center gap-2 p-2 cursor-pointer overflow-hidden"
    >
      <div className="relative">
        <Avatar className={`${isBusiness ? 'rounded-2xl' : 'rounded-full'} w-14 h-14 ring-2 ring-primary/40`}>
          <AvatarImage src={user.avatar_url ?? undefined} className={isBusiness ? 'rounded-2xl' : ''} />
          <AvatarFallback className="bg-white/5"><User className="w-5 h-5 text-white/40" /></AvatarFallback>
        </Avatar>
        <OnlineDot online={user.is_live} />
      </div>
      <div className="flex items-center gap-0.5">
        <span className="text-white text-[11px] font-semibold truncate max-w-[80px]">@{user.username ?? 'user'}</span>
        {user.is_verified && <VerifiedBadge size="sm" />}
      </div>
      <VipChip tier={vipTier} />
      <FollowBtn isFollowing={isFollowing} isSelf={isSelf} busy={busy} onClick={onFollow} compact />
    </div>
  );
};

const PostTile = ({
  post,
  onOpen,
  vipTier,
}: {
  post: PostRow & { profile?: ProfileLite };
  onOpen: () => void;
  vipTier?: string;
}) => {
  const video = isVideoUrl(post.media_url);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onOpen}
      className="relative overflow-hidden cursor-pointer group active:opacity-80 transition-opacity aspect-square bg-black"
    >
      {post.media_url ? (
        video ? (
          <video src={post.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
        ) : (
          <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        )
      ) : (
        <div className="w-full h-full bg-white/[0.03] flex items-center justify-center p-3">
          <p className="text-white/60 text-[11px] text-center line-clamp-5 leading-relaxed">{post.content}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
      {video && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" strokeWidth={0} />
        </div>
      )}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 min-w-0">
          {post.profile?.avatar_url && (
            <Avatar className="w-4 h-4">
              <AvatarImage src={post.profile.avatar_url} />
              <AvatarFallback className="bg-white/10 text-[8px]">{post.profile.username?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
          )}
          <span className="text-white text-[10px] font-semibold truncate drop-shadow-lg">@{post.profile?.username ?? 'user'}</span>
          {post.profile?.is_verified && <VerifiedBadge size="sm" />}
          <VipChip tier={vipTier} />
        </div>
        <div className="flex items-center gap-2 text-white text-[10px] font-semibold drop-shadow-lg shrink-0">
          <span>❤ {formatCount(post.likes_count)}</span>
          <span>💬 {formatCount(post.comments_count)}</span>
        </div>
      </div>
    </motion.div>
  );
};

const ReelTile = ({
  reel,
  onOpen,
  vipTier,
}: {
  reel: ReelRow & { profile?: ProfileLite };
  onOpen: () => void;
  vipTier?: string;
}) => {
  const dur = reel.duration ? `${Math.floor(reel.duration / 60)}:${String(reel.duration % 60).padStart(2, '0')}` : null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onOpen}
      className="relative overflow-hidden cursor-pointer group active:opacity-80 aspect-square bg-black"
    >
      {reel.thumbnail_url ? (
        <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <video src={reel.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
        <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-white text-[9px] font-bold flex items-center gap-0.5">
          <Film className="w-2.5 h-2.5" /> REEL
        </span>
        {dur && <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono">{dur}</span>}
      </div>
      <div className="absolute top-1.5 left-1.5">
        <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" strokeWidth={0} />
      </div>
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          {reel.profile?.avatar_url && (
            <Avatar className="w-4 h-4">
              <AvatarImage src={reel.profile.avatar_url} />
              <AvatarFallback className="bg-white/10 text-[8px]">{reel.profile.username?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
          )}
          <span className="text-white text-[10px] font-semibold truncate drop-shadow-lg">@{reel.profile?.username ?? 'user'}</span>
          {reel.profile?.is_verified && <VerifiedBadge size="sm" />}
          <VipChip tier={vipTier} />
        </div>
        <div className="flex items-center gap-2 text-white text-[10px] font-semibold drop-shadow-lg shrink-0">
          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {formatCount(reel.views_count)}</span>
          <span>❤ {formatCount(reel.likes_count)}</span>
        </div>
      </div>
    </motion.div>
  );
};

const LiveCard = ({
  live,
  vipTier,
  onJoin,
}: {
  live: LiveRow & { profile?: ProfileLite };
  vipTier?: string;
  onJoin: () => void;
}) => {
  const isBusiness = live.profile?.account_type === 'business' || live.profile?.account_type === 'government';
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onJoin}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-rose-600/30 via-fuchsia-600/20 to-black border-[0.5px] border-rose-500/30 cursor-pointer p-3 flex flex-col gap-2 min-h-[140px]"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Avatar className={`${isBusiness ? 'rounded-2xl' : 'rounded-full'} w-10 h-10 ring-2 ring-rose-500`}>
              <AvatarImage src={live.profile?.avatar_url ?? undefined} className={isBusiness ? 'rounded-2xl' : ''} />
              <AvatarFallback className="bg-white/10"><User className="w-4 h-4 text-white/50" /></AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white text-xs font-semibold truncate max-w-[100px]">@{live.profile?.username ?? 'host'}</span>
              {live.profile?.is_verified && <VerifiedBadge size="sm" />}
            </div>
            <VipChip tier={vipTier} />
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
        </span>
      </div>
      {live.title && <p className="text-white/90 text-xs line-clamp-2 relative z-10">{live.title}</p>}
      <div className="flex items-center justify-between mt-auto relative z-10">
        <span className="text-white/70 text-[10px] flex items-center gap-1">
          <Eye className="w-3 h-3" /> {formatCount(live.viewer_count)}
        </span>
        <button className="h-7 px-3 rounded-full bg-white text-black text-[10px] font-bold">انضم</button>
      </div>
    </motion.div>
  );
};

const LiveTile = ({
  live,
  vipTier,
  onJoin,
}: {
  live: LiveRow & { profile?: ProfileLite };
  vipTier?: string;
  onJoin: () => void;
}) => (
  <div
    onClick={onJoin}
    className="relative aspect-square bg-gradient-to-br from-rose-600/40 via-fuchsia-600/20 to-black cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 p-2"
  >
    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold uppercase flex items-center gap-1">
      <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Live
    </span>
    <Avatar className="w-14 h-14 ring-2 ring-rose-500">
      <AvatarImage src={live.profile?.avatar_url ?? undefined} />
      <AvatarFallback className="bg-white/10"><User className="w-5 h-5" /></AvatarFallback>
    </Avatar>
    <div className="flex items-center gap-1">
      <span className="text-white text-[11px] font-semibold truncate max-w-[80px]">@{live.profile?.username ?? 'host'}</span>
      {live.profile?.is_verified && <VerifiedBadge size="sm" />}
    </div>
    <VipChip tier={vipTier} />
    <span className="text-white/70 text-[10px] flex items-center gap-1">
      <Eye className="w-3 h-3" /> {formatCount(live.viewer_count)}
    </span>
  </div>
);

export default Explore;
