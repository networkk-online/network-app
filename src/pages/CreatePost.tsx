import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Image, Upload, X, Loader2 } from 'lucide-react';
import Header from '@/components/Header';

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صورة فقط",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
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

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء كتابة محتوى المنشور",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "سجل دخولك أولاً لنشر منشور",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      let finalMediaUrl = null;

      // Upload file if selected
      if (uploadMethod === 'file' && selectedFile) {
        finalMediaUrl = await uploadImage(selectedFile, user.id);
        if (!finalMediaUrl) {
          toast({
            title: "خطأ",
            description: "فشل رفع الصورة",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      } else if (uploadMethod === 'url' && imageUrl.trim()) {
        finalMediaUrl = imageUrl.trim();
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          media_url: finalMediaUrl
        });

      if (error) throw error;

      toast({
        title: "تم النشر! ✅",
        description: "تم نشر منشورك بنجاح",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء النشر",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="desktop-layout">
          <div className="container-responsive mobile-padding max-w-2xl mx-auto">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-white text-xl">إنشاء منشور جديد</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      محتوى المنشور
                    </label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="ماذا تريد أن تشارك؟"
                      className="min-h-[150px] bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      <Image className="w-4 h-4 inline mr-2" />
                      إضافة صورة (اختياري)
                    </label>

                    {/* Upload Method Tabs */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        variant={uploadMethod === 'file' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMethod('file')}
                        disabled={isLoading}
                        className={uploadMethod === 'file' ? 'bg-blue-600' : 'border-gray-600'}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        رفع صورة
                      </Button>
                      <Button
                        type="button"
                        variant={uploadMethod === 'url' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUploadMethod('url')}
                        disabled={isLoading}
                        className={uploadMethod === 'url' ? 'bg-blue-600' : 'border-gray-600'}
                      >
                        <Image className="w-4 h-4 mr-2" />
                        رابط صورة
                      </Button>
                    </div>

                    {uploadMethod === 'file' ? (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="image-upload"
                          disabled={isLoading}
                        />
                        
                        {!previewUrl ? (
                          <label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors bg-gray-800/50"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400">اضغط لاختيار صورة</span>
                            <span className="text-xs text-gray-500 mt-1">الحد الأقصى: 5 ميجابايت</span>
                          </label>
                        ) : (
                          <div className="relative">
                            <img
                              src={previewUrl}
                              alt="معاينة"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={handleRemoveImage}
                              disabled={isLoading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-500"
                        disabled={isLoading}
                      />
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري النشر...
                        </>
                      ) : (
                        'نشر'
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      disabled={isLoading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;