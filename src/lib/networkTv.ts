/**
 * Network TV V4 — shared types, helpers and constants.
 * Backed by the existing `videos`, `video_likes`, `video_comments`,
 * `video_views`, `video_saves` and `video_watch_history` tables.
 */

export const TV_ACCENT = '#08A045';

export type TvVisibility = 'public' | 'followers' | 'subscribers' | 'unlisted' | 'private';

export interface TvProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified?: boolean | null;
  verification_type?: string | null;
  account_type?: string | null;
  is_live?: boolean | null;
  followers_count?: number | null;
  follower_count_override?: number | string | null;
  bio?: string | null;
  cover_url?: string | null;
}

export interface TvVideo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number | null;
  likes_count: number | null;
  comments_count: number | null;
  shares_count?: number | null;
  watch_seconds?: number | null;
  hashtags?: string[] | null;
  language?: string | null;
  visibility?: TvVisibility | null;
  allow_comments?: boolean | null;
  allow_sharing?: boolean | null;
  allow_embedding?: boolean | null;
  audience?: string | null;
  is_published?: boolean | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  uploader?: TvProfile | null;
}

/** Category chips — labels are bilingual, ids match `videos.category`. */
export const TV_CATEGORIES: { id: string; ar: string; en: string }[] = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'trending', ar: 'الرائج', en: 'Trending' },
  { id: 'live', ar: 'مباشر', en: 'Live' },
  { id: 'recent', ar: 'أحدث الرفوعات', en: 'Recently uploaded' },
  { id: 'music', ar: 'موسيقى', en: 'Music' },
  { id: 'gaming', ar: 'ألعاب', en: 'Gaming' },
  { id: 'news', ar: 'أخبار', en: 'News' },
  { id: 'sports', ar: 'رياضة', en: 'Sports' },
  { id: 'technology', ar: 'تقنية', en: 'Technology' },
  { id: 'comedy', ar: 'كوميديا', en: 'Comedy' },
  { id: 'education', ar: 'تعليم', en: 'Education' },
  { id: 'podcasts', ar: 'بودكاست', en: 'Podcasts' },
  { id: 'entertainment', ar: 'ترفيه', en: 'Entertainment' },
  { id: 'movies', ar: 'أفلام', en: 'Movies' },
  { id: 'creators', ar: 'صنّاع المحتوى', en: 'Creators' },
];

/** Upload categories (real `videos.category` values only). */
export const TV_UPLOAD_CATEGORIES = TV_CATEGORIES.filter(
  (c) => !['all', 'trending', 'live', 'recent', 'creators'].includes(c.id)
).concat([{ id: 'general', ar: 'عام', en: 'General' }]);

export const VISIBILITY_OPTIONS: { id: TvVisibility; ar: string; en: string; hint: string }[] = [
  { id: 'public', ar: 'عام', en: 'Public', hint: 'يظهر للجميع في Network TV' },
  { id: 'followers', ar: 'المتابعون فقط', en: 'Followers only', hint: 'يشاهده متابعوك فقط' },
  { id: 'subscribers', ar: 'المشتركون فقط', en: 'Subscribers only', hint: 'يشاهده أصحاب الاشتراك المدفوع' },
  { id: 'unlisted', ar: 'غير مُدرج', en: 'Unlisted', hint: 'يعمل عبر الرابط فقط' },
  { id: 'private', ar: 'خاص', en: 'Private', hint: 'أنت فقط' },
];

export const formatCount = (n?: number | null): string => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
};

export const formatDuration = (s?: number | null): string => {
  const total = Math.max(0, Math.round(Number(s || 0)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `قبل ${Math.floor(diff / 86400)} يوم`;
  if (diff < 31536000) return `قبل ${Math.floor(diff / 2592000)} شهر`;
  return `قبل ${Math.floor(diff / 31536000)} سنة`;
};

export const isHls = (url?: string | null) => !!url && /\.m3u8($|\?)/i.test(url);

export const parseHashtags = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length > 0 && t.length <= 40)
    )
  ).slice(0, 20);
