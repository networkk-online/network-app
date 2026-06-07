import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Image, Upload, X, Loader2, Star, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MentionPicker } from '@/components/MentionPicker';
import MusicTrackPicker from '@/components/create/MusicTrackPicker';
import IraqLocationPicker from '@/components/create/IraqLocationPicker';
import AspectRatioToggle, { AspectRatio, getAspectClass } from '@/components/create/AspectRatioToggle';
import { motion } from 'framer-motion';

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [location, setLocation] = useState<{ name: string } | null>(null);
  const [music, setMusic] = useState<{ title: string; artist?: string; url?: string; startTime?: number } | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const validFiles = imageFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < imageFiles.length) {
      toast({ title: "تنبيه", description: "بعض الصور تجاوزت 5MB", variant: "destructive" });
    }
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 10);
    setSelectedFiles(newFiles);
    setPreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    const newUrls = previewUrls.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    if (currentImageIndex >= newFiles.length) setCurrentImageIndex(Math.max(0, newFiles.length - 1));
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({ title: "خطأ", description: "الرجاء كتابة محتوى المنشور", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      let finalMediaUrl: string | null = null;
      if (uploadMethod === 'file' && selectedFiles.length > 0) {
        finalMediaUrl = await uploadImage(selectedFiles[0], user.id);
        if (!finalMediaUrl) { toast({ title: "خطأ", description: "فشل رفع الصورة", variant: "destructive" }); setIsLoading(false); return; }
      } else if (uploadMethod === 'url' && imageUrl.trim()) {
        finalMediaUrl = imageUrl.trim();
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        media_url: finalMediaUrl,
        close_friends_only: closeFriendsOnly,
        location: location?.name || null,
        music_title: music?.title || null,
        music_artist: music?.artist || null,
        music_url: music?.url || null,
        music_start_time: music?.startTime ?? 0,
        mentions: mentions.length > 0 ? mentions : null,
      });
      if (error) throw error;
      toast({ title: "تم النشر! ✅", description: "تم نشر منشورك بنجاح" });
      navigate('/');
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "حدث خطأ أثناء النشر", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-bold text-foreground">منشور جديد</h1>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isLoading || !content.trim()}
          className="rounded-full px-5 h-8 text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر'}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto pb-24">
        {/* Music Track Picker */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.04]">
          <MusicTrackPicker onSelect={setMusic} selected={music} />
        </div>

        {/* Content Area */}
        <div className="px-4 pt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ماذا تريد أن تشارك؟ ✍️"
            className="min-h-[120px] bg-transparent border-0 text-foreground placeholder-white/25 text-base resize-none focus-visible:ring-0 p-0"
            disabled={isLoading}
          />
        </div>

        {/* Image Section */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <Button type="button" variant={uploadMethod === 'file' ? 'default' : 'ghost'} size="sm"
                onClick={() => setUploadMethod('file')}
                className={`h-7 text-xs rounded-full gap-1 ${uploadMethod === 'file' ? '' : 'text-muted-foreground'}`}>
                <Upload className="w-3 h-3" /> رفع
              </Button>
              <Button type="button" variant={uploadMethod === 'url' ? 'default' : 'ghost'} size="sm"
                onClick={() => setUploadMethod('url')}
                className={`h-7 text-xs rounded-full gap-1 ${uploadMethod === 'url' ? '' : 'text-muted-foreground'}`}>
                <Image className="w-3 h-3" /> رابط
              </Button>
            </div>
            {previewUrls.length > 0 && <AspectRatioToggle value={aspectRatio} onChange={setAspectRatio} />}
          </div>

          {uploadMethod === 'file' ? (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              {previewUrls.length === 0 ? (
                <motion.label
                  htmlFor=""
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-white/[0.1] rounded-2xl cursor-pointer hover:border-white/[0.2] transition-colors bg-white/[0.02]"
                >
                  <Upload className="w-8 h-8 text-white/20 mb-2" />
                  <span className="text-xs text-white/30">اضغط لاختيار صور (حتى 10)</span>
                </motion.label>
              ) : (
                <div className="relative">
                  {/* Image counter badge */}
                  {previewUrls.length > 1 && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold text-foreground"
                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {currentImageIndex + 1}/{previewUrls.length}
                    </div>
                  )}
                  <img
                    src={previewUrls[currentImageIndex]}
                    alt="Preview"
                    className={`w-full object-cover rounded-2xl ${getAspectClass(aspectRatio)}`}
                  />
                  <Button type="button" variant="destructive" size="icon"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full"
                    onClick={() => removeImage(currentImageIndex)}>
                    <X className="w-4 h-4" />
                  </Button>
                  {/* Thumbnails */}
                  {previewUrls.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                      {previewUrls.map((url, i) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)}
                          className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            i === currentImageIndex ? 'border-primary' : 'border-transparent opacity-60'
                          }`}>
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-14 h-14 rounded-lg flex items-center justify-center border border-dashed border-white/[0.15] flex-shrink-0 text-white/30 hover:text-white/50">
                        +
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder-white/25 rounded-xl" />
          )}
        </div>

        {/* Options */}
        <div className="px-4 pt-5 space-y-3">
          {/* Location */}
          <IraqLocationPicker onSelect={setLocation} selected={location?.name} />

          {/* Mentions */}
          <MentionPicker onMentionsChange={setMentions} currentMentions={mentions} />

          {/* Close friends */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-yellow-500" />
              <Label htmlFor="close-friends-toggle" className="text-sm text-foreground">أصدقاء مقربين فقط</Label>
            </div>
            <Switch id="close-friends-toggle" checked={closeFriendsOnly} onCheckedChange={setCloseFriendsOnly} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
