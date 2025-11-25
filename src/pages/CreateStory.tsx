import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Type, Smile, Music, Wand2, Sparkles, Paintbrush, Download, MoreHorizontal, Users, Send, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickersLibrary } from '@/components/StickersLibrary';

const CreateStory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video')[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [stickers, setStickers] = useState<Array<{ id: string; emoji: string; x: number; y: number; scale: number }>>([]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  
  const currentFile = selectedFiles[currentFileIndex];
  const currentPreview = previews[currentFileIndex];
  const currentMediaType = mediaTypes[currentFileIndex];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    const validTypes: ('image' | 'video')[] = [];

    files.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast({
          title: 'خطأ',
          description: `تم تجاهل ${file.name}: يجب أن يكون صورة أو فيديو`,
          variant: 'destructive',
        });
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'خطأ',
          description: `تم تجاهل ${file.name}: حجم الملف كبير جداً. الحد الأقصى ${isVideo ? '50' : '5'}MB`,
          variant: 'destructive',
        });
        return;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
      validTypes.push(isVideo ? 'video' : 'image');
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setPreviews(validPreviews);
      setMediaTypes(validTypes);
      setCurrentFileIndex(0);
      
      toast({
        title: 'تم الإضافة',
        description: `تم إضافة ${validFiles.length} قصة`,
      });
    }
  };

  const handleUpload = async (isCloseFriends: boolean = false) => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let successCount = 0;
      
      // Upload all files
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mediaType = mediaTypes[i];
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('stories')
          .insert({
            user_id: user.id,
            media_url: publicUrl,
            media_type: mediaType,
            close_friends_only: isCloseFriends,
            allow_story_replies: true,
          });

        if (insertError) {
          console.error('Error inserting story:', insertError);
          continue;
        }
        
        successCount++;
      }

      toast({
        title: 'تم النشر',
        description: `تم نشر ${successCount} من ${selectedFiles.length} قصة بنجاح`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error uploading stories:', error);
      toast({
        title: 'خطأ',
        description: 'فشل نشر القصص',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setShowPublishOptions(false);
    }
  };

  const handleNextFile = () => {
    if (currentFileIndex < selectedFiles.length - 1) {
      setCurrentFileIndex(prev => prev + 1);
    }
  };

  const handlePrevFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(prev => prev - 1);
    }
  };

  const removeCurrentFile = () => {
    const newFiles = selectedFiles.filter((_, i) => i !== currentFileIndex);
    const newPreviews = previews.filter((_, i) => i !== currentFileIndex);
    const newTypes = mediaTypes.filter((_, i) => i !== currentFileIndex);
    
    if (newFiles.length === 0) {
      setSelectedFiles([]);
      setPreviews([]);
      setMediaTypes([]);
      setCurrentFileIndex(0);
    } else {
      setSelectedFiles(newFiles);
      setPreviews(newPreviews);
      setMediaTypes(newTypes);
      if (currentFileIndex >= newFiles.length) {
        setCurrentFileIndex(newFiles.length - 1);
      }
    }
    
    toast({
      title: 'تم الحذف',
      description: 'تم حذف القصة',
    });
  };

  const handleStickerSelect = (emoji: string) => {
    const newSticker = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50,
      scale: 1
    };
    setStickers([...stickers, newSticker]);
    setShowStickers(false);
    toast({
      title: 'تم الإضافة',
      description: 'تم إضافة الملصق إلى قصتك',
    });
  };

  const removeSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X className="w-7 h-7" />
        </button>
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <span className="text-white text-sm font-medium">
                {currentFileIndex + 1} / {selectedFiles.length}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">
                {currentMediaType === 'image' ? '10' : '60'}
              </span>
            </div>
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={removeCurrentFile}
              className="text-white hover:bg-red-500/20 p-2 rounded-full transition-colors"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <Type className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {selectedFiles.length === 0 ? (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full px-8 py-6 text-lg"
            >
              اختر صور أو فيديوهات
            </Button>
            <p className="text-gray-400 mt-4 text-sm">يمكنك اختيار عدة ملفات في نفس الوقت</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Navigation Arrows */}
            {currentFileIndex > 0 && (
              <button
                onClick={handlePrevFile}
                className="absolute left-4 z-10 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            
            {currentFileIndex < selectedFiles.length - 1 && (
              <button
                onClick={handleNextFile}
                className="absolute right-4 z-10 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {currentMediaType === 'video' ? (
              <video
                key={currentFileIndex}
                src={currentPreview}
                className="max-h-full max-w-full object-contain"
                controls
                autoPlay
                loop
              />
            ) : (
              <img
                key={currentFileIndex}
                src={currentPreview}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* Stickers Overlay */}
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="absolute group cursor-move"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                }}
              >
                <span className="text-6xl select-none">{sticker.emoji}</span>
                <button
                  onClick={() => removeSticker(sticker.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tools Sidebar */}
      {selectedFiles.length > 0 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-10">
          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Type className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Text</span>
          </button>

          <button 
            onClick={() => setShowStickers(true)}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Smile className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Stickers</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Audio</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Restyle</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Effects</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Paintbrush className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Draw</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Download</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95">
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      {selectedFiles.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
          <div className="max-w-2xl mx-auto space-y-3">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="bg-transparent border-white/20 text-white placeholder:text-gray-400 focus:border-white/40"
            />

            <div className="flex items-center gap-3 justify-between">
              <button
                onClick={() => setShowPublishOptions(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors border border-white/10"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">الأصدقاء المقربين</span>
              </button>

              <button
                onClick={() => handleUpload(false)}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full text-white font-medium transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                قصتك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stickers Library Dialog */}
      <Dialog open={showStickers} onOpenChange={setShowStickers}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-xl p-0">
          <StickersLibrary onStickerSelect={handleStickerSelect} />
        </DialogContent>
      </Dialog>

      {/* Publish Options Dialog */}
      <Dialog open={showPublishOptions} onOpenChange={setShowPublishOptions}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-sm border-gray-700 text-white max-w-md">
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 p-2">
              <button
                onClick={() => handleUpload(false)}
                disabled={isUploading}
                className="w-full p-4 text-right hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">قصتك</p>
                    <p className="text-xs text-gray-400">مشاركة مع كل متابعيك</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUpload(true)}
                disabled={isUploading}
                className="w-full p-4 text-right hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">الأصدقاء المقربين</p>
                    <p className="text-xs text-gray-400">مشاركة مع أصدقائك المقربين فقط</p>
                  </div>
                </div>
              </button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateStory;
