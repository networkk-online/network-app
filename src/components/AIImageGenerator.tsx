import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, Wand2, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedContent {
  image?: string;
  caption: string;
  hashtags: string[];
}

export const AIImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال وصف للصورة",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // محاكاة توليد المحتوى
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // توليد وصف تلقائي للمنشور
      const captions = {
        'realistic': `لقطة رائعة ${prompt}! شاهدت هذا المنظر الجميل وقررت مشاركته معكم. ما رأيكم؟`,
        'artistic': `عمل فني مستوحى من ${prompt}. الإبداع لا حدود له! 🎨`,
        'cartoon': `شخصية كرتونية ممتعة ${prompt}! أحب هذا الأسلوب المرح 😊`,
        'abstract': `تصميم تجريدي يعبر عن ${prompt}. الفن التجريدي له سحر خاص`,
        'vintage': `طابع كلاسيكي جميل ${prompt}. الذكريات الجميلة لا تُنسى`
      };

      // اقتراح هاشتاجات حسب النوع
      const hashtagSets = {
        'realistic': ['#تصوير', '#طبيعة', '#جمال', '#واقعي', '#احترافي'],
        'artistic': ['#فن', '#إبداع', '#تصميم', '#فنان', '#جمال'],
        'cartoon': ['#كرتون', '#مرح', '#ألوان', '#شخصيات', '#متعة'],
        'abstract': ['#تجريد', '#فن_حديث', '#إبداع', '#تصميم', '#معاصر'],
        'vintage': ['#كلاسيكي', '#تراث', '#ذكريات', '#قديم', '#أصيل']
      };

      // محاكاة صورة مولدة (استخدام صورة placeholder)
      const mockImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;

      const content: GeneratedContent = {
        image: mockImageUrl,
        caption: captions[style as keyof typeof captions] || captions['realistic'],
        hashtags: hashtagSets[style as keyof typeof hashtagSets] || hashtagSets['realistic']
      };

      setGeneratedContent(content);
      
      toast({
        title: "تم التوليد بنجاح! 🎉",
        description: "تم إنشاء المحتوى والصورة بنجاح",
      });
      
    } catch (error) {
      toast({
        title: "خطأ في التوليد",
        description: "حدث خطأ أثناء توليد المحتوى",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    if (generatedContent) {
      const content = `${generatedContent.caption}\n\n${generatedContent.hashtags.join(' ')}`;
      navigator.clipboard.writeText(content);
      toast({
        title: "تم النسخ",
        description: "تم نسخ المحتوى إلى الحافظة",
      });
    }
  };

  const downloadImage = () => {
    if (generatedContent?.image) {
      const link = document.createElement('a');
      link.href = generatedContent.image;
      link.download = `ai-generated-${Date.now()}.jpg`;
      link.click();
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل الصورة بنجاح",
      });
    }
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-400" />
          مولد الصور والمنشورات بالذكاء الاصطناعي
        </CardTitle>
        <CardDescription>
          اكتب وصفاً وسيقوم الذكاء الاصطناعي بتوليد صورة ومحتوى مناسب للمنشور
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            وصف الصورة المطلوبة
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: منظر طبيعي جميل لشروق الشمس فوق الجبال..."
            className="bg-gray-800 border-gray-600 text-white min-h-20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              نوع الصورة
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="realistic">واقعي</SelectItem>
                <SelectItem value="artistic">فني</SelectItem>
                <SelectItem value="cartoon">كرتوني</SelectItem>
                <SelectItem value="abstract">تجريدي</SelectItem>
                <SelectItem value="vintage">كلاسيكي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              حجم الصورة
            </label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="512x512">مربع صغير (512×512)</SelectItem>
                <SelectItem value="1024x1024">مربع كبير (1024×1024)</SelectItem>
                <SelectItem value="1024x576">عرضي (1024×576)</SelectItem>
                <SelectItem value="576x1024">طولي (576×1024)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={generateContent}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري التوليد... قد يستغرق دقيقة
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              توليد الصورة والمحتوى
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-4 mt-6">
            {generatedContent.image && (
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-gray-300">الصورة المولدة</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadImage}
                      className="border-gray-600"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      تحميل
                    </Button>
                  </div>
                  <div className="relative">
                    <img
                      src={generatedContent.image}
                      alt="Generated"
                      className="w-full rounded-lg max-h-64 object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">النص المولد</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyContent}
                    className="border-gray-600"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    نسخ
                  </Button>
                </div>
                <p className="text-gray-300 mb-3">{generatedContent.caption}</p>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.hashtags.map((hashtag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-900/20 text-blue-400 border-blue-600"
                    >
                      {hashtag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};