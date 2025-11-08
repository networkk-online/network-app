import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Video, X, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { VideoEditor } from '@/components/VideoEditor';

const CreateReel = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار ملف فيديو',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'خطأ',
        description: 'حجم الفيديو يجب أن يكون أقل من 100 ميجابايت',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleApplyFilters = (filteredVideo: Blob) => {
    const file = new File([filteredVideo], 'filtered-video.webm', { type: 'video/webm' });
    setEditedFile(file);
    setShowEditor(false);
    toast({
      title: 'تم',
      description: 'تم تطبيق الفلاتر بنجاح',
    });
  };

  const handleUpload = async () => {
    const fileToUpload = editedFile || selectedFile;
    if (!fileToUpload) return;

    setUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'خطأ',
          description: 'يجب تسجيل الدخول لرفع الريلز',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      // Upload video to storage
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reels')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('reels')
        .getPublicUrl(fileName);

      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = previewUrl;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      const duration = Math.round(video.duration);

      // Create reel record
      const { error: dbError } = await supabase
        .from('reels')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption: caption || null,
          duration: duration
        });

      if (dbError) throw dbError;

      toast({
        title: 'نجح',
        description: 'تم نشر الريل بنجاح',
      });

      navigate('/shorts');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل رفع الريل',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-2xl mx-auto pt-24 pb-8 px-4">
        <h1 className="text-3xl font-bold text-foreground mb-6">إنشاء ريل جديد</h1>

        <div className="space-y-6">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Video className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    اختر فيديو للريل
                  </p>
                  <p className="text-sm text-muted-foreground">
                    MP4, MOV, AVI (حتى 100 ميجابايت)
                  </p>
                </div>
                <Button variant="default">
                  <Upload className="w-4 h-4 mr-2" />
                  اختيار فيديو
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {!showEditor ? (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-[500px] object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => setShowEditor(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    تطبيق فلاتر وتأثيرات
                  </Button>
                </>
              ) : (
                <VideoEditor
                  videoUrl={previewUrl}
                  onApplyFilters={handleApplyFilters}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  التعليق (اختياري)
                </label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="اكتب تعليقاً على الريل..."
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {caption.length}/500
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري النشر...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    نشر الريل
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateReel;
