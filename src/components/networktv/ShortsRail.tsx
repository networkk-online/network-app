import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, PlaySquare, Eye } from 'lucide-react';
import { TV_ACCENT, formatCount } from '@/lib/networkTv';

interface Props {
  shorts: any[];
  loading?: boolean;
}

const ShortsRail = ({ shorts, loading }: Props) => {
  const navigate = useNavigate();
  if (!loading && (!shorts || shorts.length === 0)) return null;

  return (
    <section className="mt-2" dir="rtl">
      <div className="mb-3 flex items-center gap-2">
        <PlaySquare className="h-5 w-5" style={{ color: TV_ACCENT }} />
        <h2 className="text-[15px] font-semibold text-foreground">شورتس</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[260px] w-[150px] shrink-0 animate-pulse rounded-2xl bg-white/[0.05] sm:w-[168px]" />
            ))
          : shorts.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/shorts?reel=${s.id}`)}
                className="group relative h-[260px] w-[150px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] sm:w-[168px]"
              >
                {s.thumbnail_url ? (
                  <img src={s.thumbnail_url} alt={s.caption || ''} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <video src={s.video_url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-right">
                  <p className="line-clamp-2 text-[11px] font-medium text-white">{s.caption || 'شورت'}</p>
                  <p className="mt-1 truncate text-[10px] text-white/60">@{s.uploader?.username || 'user'}</p>
                  <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-white/70">
                    <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {formatCount(s.likes_count)}</span>
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {formatCount(s.views_count)}</span>
                  </div>
                </div>
              </button>
            ))}
      </div>
    </section>
  );
};

export default memo(ShortsRail);
