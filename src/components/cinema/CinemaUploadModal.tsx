import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Film, CheckCircle2, Loader2, Video as VideoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const NEON = '#39FF14';

const CATEGORIES = [
  { id: 'general', label: 'عام' },
  { id: 'movies', label: 'أفلام' },
  { id: 'music', label: 'موسيقى' },
  { id: 'gaming', label: 'ألعاب' },
  { id: 'news', label: 'أخبار' },
  { id: 'education', label: 'تعليم' },
  { id: 'entertainment', label: 'ترفيه' },
  { id: 'sports', label: 'رياضة' },
];

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded?: (videoId: string) => void;
}

export const CinemaUploadModal = ({ open, onClose, onUploaded }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      // reset on close
      setTimeout(() => {
        setFile(null); setPreviewUrl(''); setDuration(0);
        setTitle(''); setDescription(''); setCategory('general');
        setUploading(false); setProgress(0); setDone(false);
      }, 300);
    }
  }, [open]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('video/')) {
      toast.error('يرجى اختيار ملف فيديو صالح');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('حجم الفيديو يجب أن يكون أقل من 2GB');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));

    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = () => setDuration(Math.round(v.duration || 0));
  }, [title]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const upload = async () => {
    if (!file || !title.trim()) {
      toast.error('يرجى إدخال العنوان واختيار فيديو');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('يجب تسجيل الدخول');
      return;
    }
    setUploading(true);
    setProgress(0);

    const ext = file.name.split('.').pop() || 'mp4';
    const stamp = Date.now();
    const path = `${user.id}/${stamp}.${ext}`;
    const thumbPath = `${user.id}/${stamp}_thumb.jpg`;

    // Generate thumbnail from a frame ~1s into the video
    const generateThumb = async (): Promise<Blob | null> => {
      try {
        return await new Promise<Blob | null>((resolve) => {
          const v = document.createElement('video');
          v.src = previewUrl;
          v.muted = true;
          v.playsInline = true;
          v.crossOrigin = 'anonymous';
          v.preload = 'auto';
          const cleanup = () => { v.remove(); };
          v.onloadedmetadata = () => {
            v.currentTime = Math.min(1, (v.duration || 1) * 0.1);
          };
          v.onseeked = () => {
            const canvas = document.createElement('canvas');
            const ratio = v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9;
            canvas.width = 1280;
            canvas.height = Math.round(1280 / ratio);
            const ctx = canvas.getContext('2d');
            if (!ctx) { cleanup(); return resolve(null); }
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((b) => { cleanup(); resolve(b); }, 'image/jpeg', 0.85);
          };
          v.onerror = () => { cleanup(); resolve(null); };
          setTimeout(() => { cleanup(); resolve(null); }, 8000);
        });
      } catch { return null; }
    };

    try {
      // Use XHR to a Supabase storage signed upload URL for true progress + no server timeout
      const { data: signed, error: signErr } = await supabase.storage
        .from('videos')
        .createSignedUploadUrl(path);
      if (signErr || !signed) throw signErr || new Error('فشل إنشاء رابط الرفع');

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signed.signedUrl, true);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      const { data: pub } = supabase.storage.from('videos').getPublicUrl(path);

      const { data: row, error: dbErr } = await supabase.from('videos').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        video_url: pub.publicUrl,
        duration,
        is_published: true,
      }).select('id').single();
      if (dbErr) throw dbErr;

      setDone(true);
      toast.success('تم رفع الفيديو بنجاح', {
        description: 'فيديوك أصبح متاحاً الآن في Networkk Cinema',
        className: 'glass-toast',
      });
      onUploaded?.(row.id);
      setTimeout(() => onClose(), 1400);
    } catch (e: any) {
      toast.error(e.message || 'فشل رفع الفيديو');
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md"
            onClick={() => !uploading && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:h-fit sm:max-w-2xl z-[130] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-black/85 backdrop-blur-2xl"
            style={{ boxShadow: `0 0 60px rgba(57,255,20,0.15), 0 25px 80px rgba(0,0,0,0.8)` }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-black/70 backdrop-blur-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${NEON}33, transparent)`, boxShadow: `0 0 18px ${NEON}40` }}>
                  <Film className="w-5 h-5" style={{ color: NEON }} />
                </div>
                <div>
                  <h2 className="text-foreground text-base font-bold">رفع فيديو إلى Cinema</h2>
                  <p className="text-muted-foreground text-[11px]">شارك إبداعك مع Networkk Cinema</p>
                </div>
              </div>
              <button onClick={() => !uploading && onClose()} disabled={uploading}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center disabled:opacity-30">
                <X className="w-4 h-4 text-foreground/70" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Drop zone / preview */}
              {!file ? (
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className="relative block cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 text-center group"
                  style={{
                    borderColor: dragOver ? NEON : 'rgba(57,255,20,0.35)',
                    background: dragOver ? 'rgba(57,255,20,0.05)' : 'rgba(255,255,255,0.02)',
                    boxShadow: dragOver
                      ? `0 0 40px ${NEON}55, inset 0 0 30px ${NEON}22`
                      : `0 0 20px ${NEON}22, inset 0 0 20px rgba(255,255,255,0.02)`,
                  }}
                >
                  <input ref={inputRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${NEON}1A`, boxShadow: `0 0 30px ${NEON}55` }}
                  >
                    <Upload className="w-7 h-7" style={{ color: NEON }} />
                  </motion.div>
                  <p className="text-foreground text-sm font-semibold">اسحب وأفلت الفيديو هنا</p>
                  <p className="text-muted-foreground text-xs mt-1">أو اضغط للاختيار من جهازك</p>
                  <p className="text-muted-foreground/60 text-[10px] mt-3">MP4 · WebM · MOV · حتى 2GB</p>
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10"
                  style={{ boxShadow: `0 0 25px ${NEON}30` }}>
                  <video src={previewUrl} controls className="w-full max-h-[280px] object-contain bg-black" />
                  {!uploading && !done && (
                    <button onClick={() => { setFile(null); setPreviewUrl(''); }}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/90">
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-foreground/80 flex items-center gap-1">
                    <VideoIcon className="w-3 h-3" /> {(file.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <label className="block text-foreground/80 text-xs font-medium mb-1.5">عنوان الفيديو *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                    maxLength={150}
                    placeholder="أدخل عنواناً جذاباً..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#39FF14]/50 focus:bg-white/[0.06] transition-all"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                  />
                </div>
                <div>
                  <label className="block text-foreground/80 text-xs font-medium mb-1.5">الوصف</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={uploading}
                    rows={3}
                    maxLength={1000}
                    placeholder="اكتب وصفاً يظهر تحت الفيديو..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[#39FF14]/50 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-foreground/80 text-xs font-medium mb-1.5">الفئة</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => !uploading && setCategory(c.id)}
                        disabled={uploading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          category === c.id
                            ? 'text-black border-transparent'
                            : 'bg-white/[0.04] text-foreground/70 border-white/[0.06] hover:bg-white/[0.08]'
                        }`}
                        style={category === c.id ? {
                          background: NEON, boxShadow: `0 0 18px ${NEON}66`,
                        } : undefined}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground/70 flex items-center gap-2">
                      {done ? (
                        <><CheckCircle2 className="w-4 h-4" style={{ color: NEON }} /> اكتمل الرفع</>
                      ) : (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: NEON }} /> جاري الرفع...</>
                      )}
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: NEON, textShadow: `0 0 8px ${NEON}88` }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                      className="h-full rounded-full relative"
                      style={{
                        background: `linear-gradient(90deg, ${NEON}, #00FF88)`,
                        boxShadow: `0 0 14px ${NEON}, 0 0 28px ${NEON}88`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-60"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 1.4s linear infinite' }} />
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={upload}
                disabled={!file || !title.trim() || uploading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-black"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #00FF88)`,
                  boxShadow: !file || uploading ? 'none' : `0 0 30px ${NEON}66, 0 8px 24px rgba(0,0,0,0.4)`,
                }}
              >
                {done ? '✓ تم النشر' : uploading ? `جاري الرفع ${progress}%` : '🎬 نشر في Cinema'}
              </button>
            </div>
          </motion.div>

          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default CinemaUploadModal;
