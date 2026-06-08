import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TrendingUp, Film, Image as ImageIcon, ExternalLink, Sparkles, Eye, Heart } from 'lucide-react';

const UNIFIED_AUTH_URL = 'https://ads.networkk.online/auth';

interface UserPost {
  id: string;
  content: string;
  media_url: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
}
interface UserReel {
  id: string;
  caption: string | null;
  thumbnail_url: string | null;
  video_url: string;
  likes_count: number | null;
  views_count: number | null;
  created_at: string;
}
type Item =
  | ({ kind: 'post' } & UserPost)
  | ({ kind: 'reel' } & UserReel);

const AdsStudio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [reels, setReels] = useState<UserReel[]>([]);
  const [tab, setTab] = useState<'all' | 'posts' | 'reels'>('all');
  const [selected, setSelected] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    link_url: '',
    placement: 'feed',
    days: 7,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Hand-off to the unified ads auth so session is shared across app + ads.networkk.online
        const back = encodeURIComponent(window.location.href);
        window.location.href = `${UNIFIED_AUTH_URL}?redirect=${back}`;
        return;
      }
      setUserId(session.user.id);

      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('posts').select('id,content,media_url,likes_count,comments_count,created_at')
          .eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(60),
        supabase.from('reels').select('id,caption,thumbnail_url,video_url,likes_count,views_count,created_at')
          .eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(60),
      ]);
      setPosts((p as UserPost[]) || []);
      setReels((r as UserReel[]) || []);
      setLoading(false);
    })();
  }, [navigate]);

  const openBoost = (item: Item) => {
    setSelected(item);
    setForm({
      title: item.kind === 'post'
        ? (item.content || '').slice(0, 60) || 'منشور ممول'
        : (item.caption || '').slice(0, 60) || 'ريل ممول',
      description: item.kind === 'post' ? (item.content || '') : (item.caption || ''),
      link_url: item.kind === 'post' ? `/post/${item.id}` : `/reels?reel=${item.id}`,
      placement: item.kind === 'reel' ? 'reels' : 'feed',
      days: 7,
    });
  };

  const submitBoost = async () => {
    if (!selected || !userId) return;
    setSubmitting(true);
    try {
      const image = selected.kind === 'post'
        ? (selected.media_url || '')
        : (selected.thumbnail_url || '');

      if (!image) {
        toast.error('لا يمكن ترويج منشور بدون صورة/غلاف');
        setSubmitting(false);
        return;
      }

      const now = new Date();
      const end = new Date(now.getTime() + form.days * 86400000);

      const { error } = await supabase.from('advertisements').insert([{
        title: form.title || 'حملة ممولة',
        description: form.description || null,
        image_url: image,
        link_url: form.link_url || null,
        placement: form.placement,
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        is_active: false, // pending approval
      }]);

      if (error) {
        // Most users aren't admin; fall back to the unified ads portal with the chosen item pre-filled
        const back = encodeURIComponent(
          `https://ads.networkk.online/campaigns/new?type=${selected.kind}&id=${selected.id}`
        );
        toast.message('سيتم تحويلك إلى لوحة الإعلانات المتكاملة لإكمال الحملة');
        setTimeout(() => { window.location.href = `${UNIFIED_AUTH_URL}?redirect=${back}`; }, 800);
        return;
      }
      toast.success('تم إرسال حملتك الإعلانية للمراجعة');
      setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  const items: Item[] = (() => {
    const p = posts.map(x => ({ ...x, kind: 'post' as const }));
    const r = reels.map(x => ({ ...x, kind: 'reel' as const }));
    if (tab === 'posts') return p;
    if (tab === 'reels') return r;
    return [...p, ...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto pt-20 pb-24 px-4">
        {/* Hero */}
        <div className="rounded-2xl p-6 mb-6 border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold">لوحة الإعلانات</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                اختر أي منشور أو ريل من حسابك وحوّله إلى حملة ممولة. تتم مزامنة الرصيد والبيانات
                مع <span className="text-primary">ads.networkk.online</span> بشكل لحظي.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const back = encodeURIComponent('https://ads.networkk.online/dashboard');
                window.location.href = `${UNIFIED_AUTH_URL}?redirect=${back}`;
              }}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              فتح اللوحة الكاملة
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {([['all','الكل'],['posts','منشورات'],['reels','ريلز']] as const).map(([k,label]) => (
            <Button
              key={k}
              size="sm"
              variant={tab === k ? 'default' : 'outline'}
              onClick={() => setTab(k as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري تحميل منشوراتك…</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            لا توجد منشورات أو ريلز لترويجها بعد. أنشئ محتوى أولاً ثم عُد لهنا.
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map(item => {
              const img = item.kind === 'post' ? item.media_url : item.thumbnail_url;
              const caption = item.kind === 'post' ? item.content : (item.caption || '');
              return (
                <Card key={`${item.kind}-${item.id}`} className="overflow-hidden group">
                  <div className="aspect-square bg-muted relative">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {item.kind === 'reel' ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white">
                      {item.kind === 'reel' ? 'ريل' : 'منشور'}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs line-clamp-2 min-h-[2.25rem]">{caption || '—'}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes_count || 0}</span>
                      {item.kind === 'reel' && (
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views_count || 0}</span>
                      )}
                    </div>
                    <Button size="sm" className="w-full gap-1" onClick={() => openBoost(item)}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      ترويج
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء حملة ممولة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>عنوان الحملة</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>وصف</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>موقع العرض</Label>
                <Select value={form.placement} onValueChange={v => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">الصفحة الرئيسية</SelectItem>
                    <SelectItem value="stories">القصص</SelectItem>
                    <SelectItem value="reels">الريلز</SelectItem>
                    <SelectItem value="sidebar">الشريط الجانبي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المدة (أيام)</Label>
                <Input type="number" min={1} max={90} value={form.days}
                  onChange={e => setForm({ ...form, days: Math.max(1, +e.target.value || 1) })} />
              </div>
            </div>
            <Button className="w-full" disabled={submitting} onClick={submitBoost}>
              {submitting ? 'جاري الإرسال…' : 'إطلاق الحملة'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              ستتم مراجعة الحملة ومزامنة الرصيد عبر ads.networkk.online
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdsStudio;
