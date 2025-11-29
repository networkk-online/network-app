import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { X, Type, Smile, Music, Wand2, Sparkles, Paintbrush, Download, MoreHorizontal, Users, Send, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickersLibrary } from '@/components/StickersLibrary';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

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
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [showMusicDialog, setShowMusicDialog] = useState(false);
  const [showEffectsDialog, setShowEffectsDialog] = useState(false);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [stickers, setStickers] = useState<Array<{ id: string; emoji: string; x: number; y: number; scale: number }>>([]);
  const [texts, setTexts] = useState<Array<{ id: string; text: string; x: number; y: number; fontSize: number; color: string }>>([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(32);
  const [selectedMusic, setSelectedMusic] = useState<{ title: string; artist: string; url: string } | null>(null);
  const [imageFilters, setImageFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    blur: 0
  });
  
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

  const handleAddText = () => {
    if (!currentText.trim()) return;
    const newText = {
      id: Date.now().toString(),
      text: currentText,
      x: 50,
      y: 50,
      fontSize: textSize,
      color: textColor
    };
    setTexts([...texts, newText]);
    setCurrentText('');
    setShowTextDialog(false);
    toast({
      title: 'تم الإضافة',
      description: 'تم إضافة النص إلى قصتك',
    });
  };

  const removeText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id));
  };

  const handleDownload = () => {
    if (!currentPreview) return;
    const link = document.createElement('a');
    link.href = currentPreview;
    link.download = `story_${Date.now()}.${currentMediaType === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'تم التحميل',
      description: 'تم تحميل القصة على جهازك',
    });
  };

  const applyFilter = (filterName: keyof typeof imageFilters, value: number) => {
    setImageFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getFilterStyle = () => {
    return `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturate}%) sepia(${imageFilters.sepia}%) blur(${imageFilters.blur}px)`;
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
                style={{ filter: getFilterStyle() }}
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
                style={{ filter: getFilterStyle() }}
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

            {/* Text Overlay */}
            {texts.map((text) => (
              <div
                key={text.id}
                className="absolute group cursor-move"
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <p 
                  className="font-bold select-none text-center"
                  style={{ 
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {text.text}
                </p>
                <button
                  onClick={() => removeText(text.id)}
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
          <button 
            onClick={() => setShowTextDialog(true)}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
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

          <button 
            onClick={() => setShowMusicDialog(true)}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Audio</span>
          </button>

          <button 
            onClick={() => {
              setImageFilters({
                brightness: 120,
                contrast: 110,
                saturate: 80,
                sepia: 30,
                blur: 0
              });
              toast({ title: 'تم التطبيق', description: 'تم تطبيق فلتر Vintage' });
            }}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Restyle</span>
          </button>

          <button 
            onClick={() => setShowEffectsDialog(true)}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Effects</span>
          </button>

          <button 
            onClick={() => setShowDrawDialog(true)}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Paintbrush className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Draw</span>
          </button>

          <button 
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-11 h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Download</span>
          </button>

          <button 
            onClick={() => {
              toast({ title: 'المزيد', description: 'خيارات إضافية قريباً' });
            }}
            className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform active:scale-95"
          >
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

      {/* Text Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">إضافة نص</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <Textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="اكتب نصك هنا..."
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
            <div className="space-y-2">
              <label className="text-white text-sm">اللون</label>
              <div className="flex gap-2">
                {['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'].map(color => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-10 h-10 rounded-full ${textColor === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">الحجم: {textSize}px</label>
              <Slider
                value={[textSize]}
                onValueChange={([value]) => setTextSize(value)}
                min={16}
                max={72}
                step={4}
                className="w-full"
              />
            </div>
            <Button onClick={handleAddText} className="w-full">إضافة</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stickers Library Dialog */}
      <Dialog open={showStickers} onOpenChange={setShowStickers}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-xl p-0">
          <StickersLibrary onStickerSelect={handleStickerSelect} />
        </DialogContent>
      </Dialog>

      {/* Music Dialog */}
      <Dialog open={showMusicDialog} onOpenChange={setShowMusicDialog}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">إضافة موسيقى</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-4">
            <p className="text-gray-400 text-sm">اختر موسيقى من المكتبة</p>
            {['أغنية 1', 'أغنية 2', 'أغنية 3'].map((song, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedMusic({ title: song, artist: 'فنان', url: '#' });
                  setShowMusicDialog(false);
                  toast({ title: 'تم الإضافة', description: `تم إضافة ${song}` });
                }}
                className="w-full p-3 text-right bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                {song}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Effects Dialog */}
      <Dialog open={showEffectsDialog} onOpenChange={setShowEffectsDialog}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">التأثيرات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <label className="text-white text-sm">السطوع: {imageFilters.brightness}%</label>
              <Slider
                value={[imageFilters.brightness]}
                onValueChange={([value]) => applyFilter('brightness', value)}
                min={0}
                max={200}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">التباين: {imageFilters.contrast}%</label>
              <Slider
                value={[imageFilters.contrast]}
                onValueChange={([value]) => applyFilter('contrast', value)}
                min={0}
                max={200}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">التشبع: {imageFilters.saturate}%</label>
              <Slider
                value={[imageFilters.saturate]}
                onValueChange={([value]) => applyFilter('saturate', value)}
                min={0}
                max={200}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Sepia: {imageFilters.sepia}%</label>
              <Slider
                value={[imageFilters.sepia]}
                onValueChange={([value]) => applyFilter('sepia', value)}
                min={0}
                max={100}
                step={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white text-sm">Blur: {imageFilters.blur}px</label>
              <Slider
                value={[imageFilters.blur]}
                onValueChange={([value]) => applyFilter('blur', value)}
                min={0}
                max={10}
                step={1}
              />
            </div>
            <Button 
              onClick={() => {
                setImageFilters({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, blur: 0 });
                toast({ title: 'تم الإعادة', description: 'تم إعادة التأثيرات للوضع الافتراضي' });
              }}
              variant="outline"
              className="w-full"
            >
              إعادة تعيين
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draw Dialog */}
      <Dialog open={showDrawDialog} onOpenChange={setShowDrawDialog}>
        <DialogContent className="bg-gray-900/98 backdrop-blur-sm border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">الرسم</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p className="text-gray-400 mb-4">ميزة الرسم قيد التطوير</p>
            <p className="text-sm text-gray-500">ستتمكن قريباً من الرسم على قصصك</p>
          </div>
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
