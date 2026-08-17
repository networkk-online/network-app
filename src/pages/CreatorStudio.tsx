import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, BarChart3, Clock, Eye, EyeOff, Film, Heart, LayoutDashboard,
  MessageSquare, Pin, Trash2, TrendingUp, Upload as UploadIcon, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreatorStats, useCreatorViewEvents, useCurrentUserId } from '@/hooks/useNetworkTv';
import { TV_ACCENT, VISIBILITY_OPTIONS, formatCount, formatDuration, timeAgo, type TvVideo } from '@/lib/networkTv';
import { cn } from '@/lib/utils';

const db = supabase as any;

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'content', label: 'المحتوى', icon: Film },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'comments', label: 'التعليقات', icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
    <div className="mb-2 flex items-center gap-2 text-[12px] text-foreground/50">
      <Icon className="h-4 w-4" style={{ color: TV_ACCENT }} /> {label}
    </div>
    <p className="text-[22px] font-bold tabular-nums">{value}</p>
  </div>
);

const CreatorStudio = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = useCurrentUserId();
  const [tab, setTab] = useState<TabId>('overview');
  const [range, setRange] = useState(28);

  const { stats, videos, profile, isLoading, refetch } = useCreatorStats(userId);
  const events = useCreatorViewEvents(userId, range);

  useEffect(() => {
    if (userId === null) navigate('/login');
  }, [userId, navigate]);

  const comments = useQuery({
    queryKey: ['studio-comments', userId],
    enabled: !!userId && tab === 'comments',
    queryFn: async () => {
      const ids = videos.map((v) => v.id);
      if (!ids.length) return [];
      const { data } = await db
        .from('video_comments')
        .select('*')
        .in('video_id', ids)
        .order('created_at', { ascending: false })
        .limit(200);
      const rows = (data || []) as any[];
      const uids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (!uids.length) return rows;
      const { data: profs } = await supabase.from('profiles').select('id,username,avatar_url').in('id', uids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      return rows.map((r) => ({ ...r, author: map.get(r.user_id) || null }));
    },
  });

  const daily = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = range - 1; i >= 0; i--) {
      buckets.set(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10), 0);
    }
    (events.data || []).forEach((e: any) => {
      const k = String(e.created_at).slice(0, 10);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  }, [events.data, range]);

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const topVideos = useMemo(() => [...videos].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 8), [videos]);

  const devices = useMemo(() => {
    const m = new Map<string, number>();
    (events.data || []).forEach((e: any) => m.set(e.device || 'unknown', (m.get(e.device || 'unknown') || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [events.data]);

  const updateVideo = async (id: string, patch: Record<string, any>) => {
    const { error } = await db.from('videos').update(patch).eq('id', id);
    if (error) return toast.error('تعذر التحديث');
    toast.success('تم التحديث');
    refetch();
  };

  const deleteVideo = async (id: string) => {
    const { error } = await db.from('videos').update({ deleted_at: new Date().toISOString(), is_published: false }).eq('id', id);
    if (error) return toast.error('تعذر الحذف');
    toast.success('تم حذف الفيديو');
    refetch();
  };

  const moderateComment = async (id: string, patch: Record<string, any>) => {
    const { error } = await db.from('video_comments').update(patch).eq('id', id);
    if (error) return toast.error('تعذر تنفيذ الإجراء');
    qc.invalidateQueries({ queryKey: ['studio-comments', userId] });
  };

  const deleteComment = async (id: string) => {
    const { error } = await db.from('video_comments').delete().eq('id', id);
    if (error) return toast.error('تعذر الحذف');
    qc.invalidateQueries({ queryKey: ['studio-comments', userId] });
  };

  return (
    <div className="min-h-screen bg-black text-foreground" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <button onClick={() => navigate('/network-tv')} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05]" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold">استوديو المبدعين</h1>
          <button onClick={() => navigate('/creator-studio/upload')} className="ms-auto flex min-h-[40px] items-center gap-2 rounded-full px-4 text-[13px] font-bold text-black" style={{ background: TV_ACCENT }}>
            <UploadIcon className="h-4 w-4" /> رفع فيديو
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 pt-4 sm:px-5" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        {/* Sidebar / mobile chips */}
        <nav className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-20 space-y-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px]', tab === t.id ? 'bg-white/[0.08] font-semibold' : 'text-foreground/60 hover:bg-white/[0.04]')}>
                <t.icon className="h-4 w-4" style={tab === t.id ? { color: TV_ACCENT } : undefined} /> {t.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('min-h-[38px] shrink-0 rounded-full px-4 text-[12px]', tab === t.id ? 'text-black' : 'bg-white/[0.05] text-foreground/70')} style={tab === t.id ? { background: TV_ACCENT } : undefined}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="h-14 w-14 rounded-full bg-white/[0.08]" />}
                <div>
                  <p className="text-[15px] font-semibold">{profile?.full_name || profile?.username || 'قناتي'}</p>
                  <p className="text-[12px] text-foreground/50">{formatCount(stats?.followers)} متابع</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <StatCard icon={Film} label="الفيديوهات" value={formatCount(stats?.videos)} />
                <StatCard icon={Eye} label="المشاهدات" value={formatCount(stats?.views)} />
                <StatCard icon={Heart} label="الإعجابات" value={formatCount(stats?.likes)} />
                <StatCard icon={MessageSquare} label="التعليقات" value={formatCount(stats?.comments)} />
                <StatCard icon={Clock} label="وقت المشاهدة" value={formatDuration(stats?.watchSeconds)} />
                <StatCard icon={Users} label="المتابعون" value={formatCount(stats?.followers)} />
              </div>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold"><TrendingUp className="h-4 w-4" style={{ color: TV_ACCENT }} /> الأكثر مشاهدة</h2>
                <div className="space-y-2">
                  {topVideos.map((v) => (
                    <button key={v.id} onClick={() => navigate(`/network-tv/watch/${v.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-right">
                      <img src={v.thumbnail_url || ''} alt="" className="h-12 w-20 rounded-lg bg-white/[0.05] object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]">{v.title}</span>
                        <span className="block text-[11px] text-foreground/45">{formatCount(v.views_count)} مشاهدة · {timeAgo(v.created_at)}</span>
                      </span>
                    </button>
                  ))}
                  {!isLoading && topVideos.length === 0 && <p className="text-[13px] text-foreground/40">لا توجد فيديوهات بعد</p>}
                </div>
              </section>
            </div>
          )}

          {tab === 'content' && (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <table className="w-full min-w-[720px] text-right text-[13px]">
                <thead className="text-[11px] text-foreground/45">
                  <tr>
                    <th className="p-3 font-normal">الفيديو</th>
                    <th className="p-3 font-normal">الظهور</th>
                    <th className="p-3 font-normal">المشاهدات</th>
                    <th className="p-3 font-normal">الإعجابات</th>
                    <th className="p-3 font-normal">التاريخ</th>
                    <th className="p-3 font-normal">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v: TvVideo) => (
                    <tr key={v.id} className="border-t border-white/[0.05]">
                      <td className="p-3">
                        <button onClick={() => navigate(`/network-tv/watch/${v.id}`)} className="flex items-center gap-3 text-right">
                          <img src={v.thumbnail_url || ''} alt="" className="h-11 w-20 rounded-lg bg-white/[0.05] object-cover" />
                          <span className="line-clamp-2 max-w-[240px] text-[13px]">{v.title}</span>
                        </button>
                      </td>
                      <td className="p-3">
                        <select
                          value={v.visibility || 'public'}
                          onChange={(e) => updateVideo(v.id, { visibility: e.target.value, is_published: e.target.value !== 'private' })}
                          className="min-h-[36px] rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-[12px]"
                        >
                          {VISIBILITY_OPTIONS.map((o) => <option key={o.id} value={o.id} className="bg-black">{o.ar}</option>)}
                        </select>
                      </td>
                      <td className="p-3 tabular-nums">{formatCount(v.views_count)}</td>
                      <td className="p-3 tabular-nums">{formatCount(v.likes_count)}</td>
                      <td className="p-3 text-[12px] text-foreground/50">{timeAgo(v.created_at)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateVideo(v.id, { is_published: !v.is_published })} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05]" aria-label="نشر/إخفاء">
                            {v.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => deleteVideo(v.id)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-red-400" aria-label="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && videos.length === 0 && <p className="p-6 text-center text-[13px] text-foreground/40">لم ترفع أي فيديو بعد</p>}
            </div>
          )}

          {tab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex gap-2">
                {[7, 28, 90].map((d) => (
                  <button key={d} onClick={() => setRange(d)} className={cn('min-h-[36px] rounded-full px-4 text-[12px]', range === d ? 'text-black' : 'bg-white/[0.05] text-foreground/70')} style={range === d ? { background: TV_ACCENT } : undefined}>
                    آخر {d} يوم
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-3 text-[13px] font-semibold">المشاهدات اليومية</p>
                <div className="flex h-40 items-end gap-[3px]" dir="ltr">
                  {daily.map((d) => (
                    <div key={d.date} title={`${d.date}: ${d.count}`} className="flex-1 rounded-t-sm" style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: 2, background: TV_ACCENT, opacity: d.count ? 0.9 : 0.2 }} />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-foreground/40">إجمالي {formatCount((events.data || []).length)} مشاهدة موثّقة خلال الفترة</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[13px] font-semibold">الأجهزة</p>
                  {devices.length === 0 && <p className="text-[12px] text-foreground/40">لا توجد بيانات بعد</p>}
                  {devices.map(([name, count]) => (
                    <div key={name} className="mb-2">
                      <div className="flex justify-between text-[12px] text-foreground/60"><span>{name}</span><span>{count}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${(count / (events.data?.length || 1)) * 100}%`, background: TV_ACCENT }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[13px] font-semibold">أفضل الفيديوهات</p>
                  {topVideos.slice(0, 5).map((v) => (
                    <div key={v.id} className="mb-2 flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate text-foreground/70">{v.title}</span>
                      <span className="tabular-nums text-foreground/50">{formatCount(v.views_count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'comments' && (
            <div className="space-y-3">
              {(comments.data || []).map((c: any) => (
                <div key={c.id} className={cn('rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3', c.is_hidden && 'opacity-50')}>
                  <div className="flex items-start gap-3">
                    {c.author?.avatar_url ? <img src={c.author.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full bg-white/[0.08]" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-foreground/55">@{c.author?.username || 'user'} · {timeAgo(c.created_at)}</p>
                      <p className="whitespace-pre-wrap text-[13px]">{c.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moderateComment(c.id, { is_pinned: !c.is_pinned })} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05]" aria-label="تثبيت">
                        <Pin className="h-4 w-4" style={c.is_pinned ? { color: TV_ACCENT } : undefined} />
                      </button>
                      <button onClick={() => moderateComment(c.id, { is_hidden: !c.is_hidden })} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05]" aria-label="إخفاء">
                        {c.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deleteComment(c.id)} className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-red-400" aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {comments.isFetched && (comments.data || []).length === 0 && <p className="py-10 text-center text-[13px] text-foreground/40">لا توجد تعليقات</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreatorStudio;
