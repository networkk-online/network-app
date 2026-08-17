import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Film, ImageIcon, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserId } from '@/hooks/useNetworkTv';
import { TV_ACCENT, TV_UPLOAD_CATEGORIES, VISIBILITY_OPTIONS, parseHashtags, type TvVisibility } from '@/lib/networkTv';
import { cn } from '@/lib/utils';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

const Upload = () => {
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  const fileInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(TV_UPLOAD_CATEGORIES[0]?.id || 'entertainment');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState<TvVisibility>('public');
  const [scheduledAt, setScheduledAt] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const pickFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) return toast.error('يرجى اختيار ملف فيديو');
    if (f.size > MAX_BYTES) return toast.error('حجم الملف يتجاوز 2 جيجابايت');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => { setDuration(Math.round(el.duration || 0)); URL.revokeObjectURL(el.src); };
    el.src = URL.createObjectURL(f);
    setStep(2);
  }, [title]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const submit = async () => {
    if (!userId) return toast.error('يجب تسجيل الدخول');
    if (!file) return toast.error('اختر ملف الفيديو');
    if (!title.trim()) return toast.error('أدخل عنوان الفيديو');

    setSaving(true);
    setProgress(2);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${userId}/${Date.now()}.${ext}`;

      // Simulated-free real progress: XHR upload to the storage REST endpoint
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const base = (supabase as any).storageUrl || `${import.meta.env.VITE_SUPABASE_URL}/storage/v1`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${base}/object/videos/${path}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('x-upsert', 'true');
        if (file.type) xhr.setRequestHeader('Content-Type', file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.max(2, Math.round((e.loaded / e.total) * 92)));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText)));
        xhr.onerror = () => reject(new Error('network'));
        xhr.send(file);
      });

      const { data: pub } = supabase.storage.from('videos').getPublicUrl(path);
      let thumbUrl: string | null = null;

      if (thumbFile) {
        setProgress(95);
        const tExt = thumbFile.name.split('.').pop() || 'jpg';
        const tPath = `${userId}/thumbs/${Date.now()}.${tExt}`;
        const { error: tErr } = await supabase.storage.from('videos').upload(tPath, thumbFile, { upsert: true });
        if (!tErr) thumbUrl = supabase.storage.from('videos').getPublicUrl(tPath).data.publicUrl;
      }

      setProgress(98);
      const scheduled = scheduledAt ? new Date(scheduledAt).toISOString() : null;
      const isFuture = !!scheduled && new Date(scheduled).getTime() > Date.now();

      const { data: row, error } = await (supabase as any)
        .from('videos')
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          category,
          hashtags: parseHashtags(hashtags),
          video_url: pub.publicUrl,
          thumbnail_url: thumbUrl,
          duration,
          visibility,
          scheduled_at: scheduled,
          published_at: isFuture ? null : new Date().toISOString(),
          is_published: !isFuture && visibility !== 'private',
          allow_comments: allowComments,
          allow_sharing: allowSharing,
        })
        .select('id')
        .single();

      if (error) throw error;
      setProgress(100);
      toast.success(isFuture ? 'تمت جدولة الفيديو' : 'تم نشر الفيديو');
      navigate(row?.id ? `/network-tv/watch/${row.id}` : '/creator-studio');
    } catch (e: any) {
      toast.error('فشل الرفع، حاول مجدداً');
      setProgress(0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground" dir="rtl">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <button onClick={() => navigate('/creator-studio')} className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05]" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold">رفع فيديو جديد</h1>
          <span className="ms-auto text-[12px] text-foreground/45">الخطوة {step} من 2</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}>
        {step === 1 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] || null); }}
            className="grid min-h-[320px] place-items-center rounded-3xl border border-dashed border-white/[0.14] bg-white/[0.03] p-8 text-center"
          >
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full" style={{ background: `${TV_ACCENT}1f` }}>
                <UploadCloud className="h-7 w-7" style={{ color: TV_ACCENT }} />
              </div>
              <p className="text-[15px] font-semibold">اسحب الفيديو هنا أو اختره من جهازك</p>
              <p className="mt-1 text-[12px] text-foreground/45">MP4, MOV, WebM — حتى 2 جيجابايت</p>
              <button onClick={() => fileInput.current?.click()} className="mt-5 min-h-[44px] rounded-full px-6 text-[13px] font-semibold text-black" style={{ background: TV_ACCENT }}>
                اختيار ملف
              </button>
              <input ref={fileInput} type="file" accept="video/*" hidden onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <label className="mb-1 block text-[12px] text-foreground/60">العنوان *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} className="min-h-[44px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[14px] outline-none" />
                <p className="mt-1 text-left text-[11px] text-foreground/35">{title.length}/120</p>

                <label className="mb-1 mt-3 block text-[12px] text-foreground/60">الوصف</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 5000))} rows={5} className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-[14px] outline-none" />

                <label className="mb-1 mt-3 block text-[12px] text-foreground/60">الوسوم (مفصولة بمسافة أو فاصلة)</label>
                <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#networkk #بث" className="min-h-[44px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[14px] outline-none" />
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-2 text-[12px] text-foreground/60">التصنيف</p>
                <div className="flex flex-wrap gap-2">
                  {TV_UPLOAD_CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setCategory(c.id)} className={cn('min-h-[36px] rounded-full px-4 text-[12px]', category === c.id ? 'text-black' : 'bg-white/[0.06] text-foreground/70')} style={category === c.id ? { background: TV_ACCENT } : undefined}>
                      {c.ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-2 text-[12px] text-foreground/60">من يمكنه المشاهدة</p>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((o) => (
                    <button key={o.id} onClick={() => setVisibility(o.id)} className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-right', visibility === o.id ? 'border-white/20 bg-white/[0.07]' : 'border-white/[0.06] bg-white/[0.02]')}>
                      <span className={cn('grid h-5 w-5 place-items-center rounded-full border', visibility === o.id ? 'border-transparent' : 'border-white/25')} style={visibility === o.id ? { background: TV_ACCENT } : undefined}>
                        {visibility === o.id && <Check className="h-3 w-3 text-black" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{o.ar}</span>
                        <span className="block text-[11px] text-foreground/45">{o.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <label className="mb-1 mt-4 block text-[12px] text-foreground/60">جدولة النشر (اختياري)</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] outline-none" />

                <div className="mt-4 space-y-2">
                  {[
                    { label: 'السماح بالتعليقات', value: allowComments, set: setAllowComments },
                    { label: 'السماح بالمشاركة', value: allowSharing, set: setAllowSharing },
                  ].map((t) => (
                    <button key={t.label} onClick={() => t.set(!t.value)} className="flex min-h-[44px] w-full items-center justify-between rounded-xl bg-white/[0.03] px-3 text-[13px]">
                      {t.label}
                      <span className={cn('relative h-6 w-11 rounded-full transition', t.value ? '' : 'bg-white/15')} style={t.value ? { background: TV_ACCENT } : undefined}>
                        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', t.value ? 'left-0.5' : 'right-0.5')} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview column */}
            <aside className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                {previewUrl ? (
                  <video src={previewUrl} controls playsInline className="aspect-video w-full bg-black object-contain" />
                ) : (
                  <div className="grid aspect-video place-items-center"><Film className="h-6 w-6 text-foreground/30" /></div>
                )}
                <div className="p-3 text-[12px] text-foreground/50">
                  <p className="truncate">{file?.name}</p>
                  <p>{duration ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}` : '—'} · {file ? `${(file.size / 1048576).toFixed(1)} MB` : ''}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <p className="mb-2 text-[12px] text-foreground/60">الصورة المصغّرة</p>
                {thumbPreview ? (
                  <div className="relative">
                    <img src={thumbPreview} alt="" className="aspect-video w-full rounded-xl object-cover" />
                    <button onClick={() => { setThumbFile(null); setThumbPreview(null); }} className="absolute top-2 left-2 grid h-7 w-7 place-items-center rounded-full bg-black/70" aria-label="إزالة">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => thumbInput.current?.click()} className="grid aspect-video w-full place-items-center rounded-xl border border-dashed border-white/15 text-[12px] text-foreground/45">
                    <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> اختر صورة</span>
                  </button>
                )}
                <input ref={thumbInput} type="file" accept="image/*" hidden onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setThumbFile(f);
                  setThumbPreview(URL.createObjectURL(f));
                }} />
              </div>

              {saving && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span>جارٍ الرفع…</span><span className="tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full transition-all" style={{ width: `${progress}%`, background: TV_ACCENT }} />
                  </div>
                </div>
              )}

              <button onClick={submit} disabled={saving} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold text-black disabled:opacity-60" style={{ background: TV_ACCENT }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {scheduledAt ? 'جدولة النشر' : 'نشر الفيديو'}
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Upload;
