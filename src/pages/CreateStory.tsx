import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Image as ImageIcon, Video, X } from 'lucide-react';

const CreateStory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      
      // Check video size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الفيديو يجب أن يكون أقل من 50 ميجابايت",
          variant: "destructive"
        });
        return;
      }
    } else {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة أو فيديو",
        variant: "destructive"
      });
      return;
    }

    // Check image size
    if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType
        });

      if (insertError) throw insertError;

      toast({
        title: "تم النشر",
        description: "تم نشر قصتك بنجاح",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error uploading story:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء رفع القصة",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-full">
                <ArrowRight className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold">إضافة قصة جديدة</h1>
            </div>
            {selectedFile && (
              <Button 
                onClick={handleUpload}
                disabled={uploading}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold"
              >
                {uploading ? 'جاري النشر...' : 'نشر القصة'}
              </Button>
            )}
          </div>

          {!selectedFile ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-12 border-2 border-dashed border-gray-700 rounded-lg hover:border-green-500 transition-colors"
              >
                <div className="flex flex-col items-center space-y-4">
                  <ImageIcon className="w-16 h-16 text-gray-500" />
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-2">اختر صورة أو فيديو</p>
                    <p className="text-sm text-gray-400">الصور: حتى 5 ميجابايت</p>
                    <p className="text-sm text-gray-400">الفيديوهات: حتى 50 ميجابايت</p>
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.click();
                    }
                  }}
                  variant="secondary"
                  className="h-32 flex flex-col items-center justify-center space-y-2"
                >
                  <ImageIcon className="w-10 h-10" />
                  <span>صورة</span>
                </Button>
                
                <Button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'video/*';
                      fileInputRef.current.click();
                    }
                  }}
                  variant="secondary"
                  className="h-32 flex flex-col items-center justify-center space-y-2"
                >
                  <Video className="w-10 h-10" />
                  <span>فيديو</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl('');
                }}
                className="absolute top-4 right-4 z-10 bg-black/70 p-2 rounded-full hover:bg-black"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              <div className="rounded-lg overflow-hidden bg-gray-900">
                {mediaType === 'video' ? (
                  <video 
                    src={previewUrl}
                    controls
                    className="w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <img 
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateStory;
