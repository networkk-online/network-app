import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Clock, Crown, Flag, MoreVertical, Radio, Share2, EyeOff } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import VerifiedBadge from '@/components/VerifiedBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TV_ACCENT, formatCount, formatDuration, timeAgo, type TvVideo } from '@/lib/networkTv';
import { cn } from '@/lib/utils';

interface Props {
  video: TvVideo;
  onHide?: (id: string) => void;
  compact?: boolean;
}

const VideoCard = ({ video, onHide, compact }: Props) => {
  const navigate = useNavigate();
  const u = video.uploader;
  const isLive = !!u?.is_live;
  const isVip = u?.account_type === 'business' || u?.account_type === 'government';

  const save = useCallback(
    async (kind: 'save' | 'watch_later') => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        toast.error('يجب تسجيل الدخول');
        return;
      }
      const { error } = await (supabase as any)
        .from('video_saves')
        .insert({ user_id: data.user.id, video_id: video.id, kind });
      if (error && !String(error.message).includes('duplicate')) toast.error('تعذر الحفظ');
      else toast.success(kind === 'save' ? 'تم الحفظ' : 'أضيف إلى المشاهدة لاحقاً');
    },
    [video.id]
  );

  const share = useCallback(async () => {
    const url = `${window.location.origin}/network-tv/watch/${video.id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('تم نسخ الرابط');
      }
    } catch {
      /* user cancelled */
    }
  }, [video.id, video.title]);

  const report = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return toast.error('يجب تسجيل الدخول');
    const { error } = await supabase.from('reports').insert({
      reporter_id: data.user.id,
      reported_user_id: video.user_id,
      content_type: 'video',
      content_id: video.id,
      reason: 'inappropriate_content',
    } as any);
    if (error) toast.error('تعذر إرسال البلاغ');
    else toast.success('تم إرسال البلاغ');
  }, [video.id, video.user_id]);

  const open = () => navigate(`/network-tv/watch/${video.id}`);

  return (
    <article className={cn('group flex flex-col gap-3', compact && 'sm:flex-row')} dir="rtl">
      <button
        onClick={open}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] transition-transform duration-300 group-hover:-translate-y-0.5',
          compact ? 'sm:w-44 sm:shrink-0' : ''
        )}
        aria-label={video.title}
      >
        <div className="aspect-video w-full">
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-foreground/40">لا توجد صورة</div>
          )}
        </div>
        {isLive ? (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Radio className="h-3 w-3" /> LIVE
          </span>
        ) : (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        {video.visibility === 'subscribers' && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-black" style={{ background: TV_ACCENT }}>
            <Crown className="h-3 w-3" /> مشتركين
          </span>
        )}
      </button>

      <div className="flex gap-3">
        {!compact && (
          <button onClick={() => navigate(`/profile/${video.user_id}`)} className="shrink-0" aria-label={u?.username || 'creator'}>
            {u?.avatar_url ? (
              <img src={u.avatar_url} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-xs text-foreground/60">
                {(u?.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <button onClick={open} className="block w-full text-right">
            <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">{video.title}</h3>
          </button>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-foreground/55">
            <button onClick={() => navigate(`/profile/${video.user_id}`)} className="truncate hover:text-foreground">
              {u?.full_name || u?.username || 'مستخدم'}
            </button>
            {u?.is_verified && <VerifiedBadge size="sm" verificationType={(u.verification_type as any) || null} userId={u.id} />}
            {isVip && <Crown className="h-3 w-3 text-amber-400" />}
          </div>
          <p className="mt-0.5 text-[12px] text-foreground/45">
            {formatCount(video.views_count)} مشاهدة · {timeAgo(video.created_at)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 w-9 shrink-0 rounded-full text-foreground/50 opacity-70 transition hover:bg-white/[0.07] hover:opacity-100" aria-label="خيارات">
              <MoreVertical className="mx-auto h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-white/[0.08] bg-black/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={() => save('save')}><Bookmark className="ms-2 h-4 w-4" /> حفظ</DropdownMenuItem>
            <DropdownMenuItem onClick={() => save('watch_later')}><Clock className="ms-2 h-4 w-4" /> المشاهدة لاحقاً</DropdownMenuItem>
            <DropdownMenuItem onClick={share}><Share2 className="ms-2 h-4 w-4" /> مشاركة</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onHide?.(video.id)}><EyeOff className="ms-2 h-4 w-4" /> غير مهتم</DropdownMenuItem>
            <DropdownMenuItem onClick={report} className="text-red-400"><Flag className="ms-2 h-4 w-4" /> إبلاغ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
};

export const VideoCardSkeleton = ({ compact }: { compact?: boolean }) => (
  <div className={cn('flex animate-pulse flex-col gap-3', compact && 'sm:flex-row')}>
    <div className={cn('aspect-video w-full rounded-2xl bg-white/[0.05]', compact && 'sm:w-44 sm:shrink-0')} />
    <div className="flex gap-3">
      {!compact && <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.05]" />}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-4/5 rounded bg-white/[0.05]" />
        <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
        <div className="h-3 w-2/5 rounded bg-white/[0.03]" />
      </div>
    </div>
  </div>
);

export default memo(VideoCard);
