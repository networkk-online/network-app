import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Sparkles, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TvTopBar from '@/components/networktv/TvTopBar';
import CategoryChips from '@/components/networktv/CategoryChips';
import VideoCard, { VideoCardSkeleton } from '@/components/networktv/VideoCard';
import ShortsRail from '@/components/networktv/ShortsRail';
import { useTvFeed, useTvLive, useTvShorts, useCurrentUserId } from '@/hooks/useNetworkTv';
import { TV_ACCENT, formatCount, type TvVideo } from '@/lib/networkTv';

const RECENT_KEY = 'tv_recent_searches';
const HIDDEN_KEY = 'tv_hidden_videos';

const NetworkTV = () => {
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); } catch { return []; }
  });
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  const feed = useTvFeed({ category, search, userId });
  const shorts = useTvShorts(12);
  const live = useTvLive(8);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle().then(({ data }) => setAvatar(data?.avatar_url || null));
  }, [userId]);

  // Persist recent searches
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => {
      setRecent((prev) => {
        const next = [term, ...prev.filter((r) => r !== term)].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [search]);

  // Infinite loading
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [feed]);

  const hideVideo = useCallback((id: string) => {
    setHidden((prev) => {
      const next = Array.from(new Set([...prev, id])).slice(-300);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const videos: TvVideo[] = useMemo(() => {
    const flat = (feed.data?.pages || []).flat() as TvVideo[];
    const skip = new Set(hidden);
    return flat.filter((v) => !skip.has(v.id));
  }, [feed.data, hidden]);

  const liveRooms = live.data || [];
  const showLive = category === 'all' || category === 'live';

  return (
    <div className="min-h-screen bg-black text-foreground" dir="rtl">
      <TvTopBar search={search} onSearchChange={setSearch} avatarUrl={avatar} />
      <CategoryChips active={category} onChange={setCategory} />

      <main
        className="mx-auto max-w-[1800px] px-3 pb-32 pt-4 sm:px-5"
        style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      >
        {search.trim().length === 0 && recent.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-foreground/45">عمليات بحث سابقة:</span>
            {recent.map((r) => (
              <button key={r} onClick={() => setSearch(r)} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] text-foreground/70 hover:bg-white/[0.08]">
                {r}
              </button>
            ))}
          </div>
        )}

        {showLive && liveRooms.length > 0 && (
          <section className="mb-6" dir="rtl">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              <h2 className="text-[15px] font-semibold">بث مباشر الآن</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {liveRooms.map((room: any) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`/broadcast?stream=${room.id}`)}
                  className="relative w-[260px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] text-right ring-1 ring-white/[0.06]"
                >
                  <div className="aspect-video w-full">
                    {room.thumbnail_url || room.cover_url ? (
                      <img src={room.thumbnail_url || room.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-white/[0.03]"><Tv className="h-6 w-6 text-foreground/30" /></div>
                    )}
                  </div>
                  <span className="absolute top-2 left-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">LIVE</span>
                  <div className="p-3">
                    <p className="line-clamp-1 text-[13px] font-semibold">{room.title || 'بث مباشر'}</p>
                    <p className="mt-0.5 text-[11px] text-foreground/50">@{room.host?.username || 'user'} · {formatCount(room.viewers_count || room.viewer_count)} مشاهد</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {(category === 'all' || category === 'creators') && (
          <ShortsRail shorts={shorts.data || []} loading={shorts.isLoading} />
        )}

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: TV_ACCENT }} />
            <h1 className="text-[15px] font-semibold">
              {search.trim() ? `نتائج البحث عن "${search.trim()}"` : 'مقاطع Network TV'}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {feed.isLoading
              ? Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
              : videos.map((v) => <VideoCard key={v.id} video={v} onHide={hideVideo} />)}
            {feed.isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={`n${i}`} />)}
          </div>

          {!feed.isLoading && videos.length === 0 && (
            <div className="py-24 text-center">
              <Tv className="mx-auto mb-3 h-10 w-10 text-foreground/20" />
              <p className="text-sm text-foreground/50">لا توجد فيديوهات هنا بعد</p>
              <Link to="/creator-studio/upload" className="mt-4 inline-block rounded-full px-5 py-2 text-[13px] font-semibold text-black" style={{ background: TV_ACCENT }}>
                ارفع أول فيديو
              </Link>
            </div>
          )}

          <div ref={sentinel} className="h-10" />
        </section>
      </main>
    </div>
  );
};

export default NetworkTV;
