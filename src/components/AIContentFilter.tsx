import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Hash, Sparkles, Image, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentAnalysis {
  contentType: string;
  suggestedHashtags: string[];
  sentiment: string;
  topics: string[];
}

export const AIContentFilter = () => {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeContent = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال محتوى للتحليل",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // محاكاة تحليل المحتوى بالذكاء الاصطناعي
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // تحليل نوع المحتوى
      const contentTypes = {
        'سفر': ['سفر', 'رحلة', 'مطار', 'فندق', 'بحر', 'جبل'],
        'طعام': ['طعام', 'مطعم', 'وجبة', 'طبخ', 'أكل'],
        'تقنية': ['تقنية', 'برمجة', 'كمبيوتر', 'تطبيق', 'موقع'],
        'رياضة': ['رياضة', 'كرة', 'تمرين', 'نادي', 'مباراة'],
        'فن': ['فن', 'رسم', 'تصوير', 'موسيقى', 'معرض'],
        'شخصي': ['شخصي', 'يوم', 'حياة', 'صباح', 'مساء']
      };

      let detectedType = 'عام';
      let maxMatches = 0;
      
      Object.entries(contentTypes).forEach(([type, keywords]) => {
        const matches = keywords.filter(keyword => 
          content.toLowerCase().includes(keyword)
        ).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          detectedType = type;
        }
      });

      // اقتراح هاشتاجات حسب نوع المحتوى
      const hashtagSuggestions = {
        'سفر': ['#سفر', '#رحلة', '#استكشاف', '#مغامرة', '#سياحة'],
        'طعام': ['#طعام', '#مطبخ', '#وصفة', '#لذيذ', '#طبخ'],
        'تقنية': ['#تقنية', '#برمجة', '#تطوير', '#ابتكار', '#ديجيتال'],
        'رياضة': ['#رياضة', '#تمرين', '#لياقة', '#صحة', '#نشاط'],
        'فن': ['#فن', '#إبداع', '#تصميم', '#جمال', '#ثقافة'],
        'شخصي': ['#يوميات', '#حياة', '#تجربة', '#مشاعر', '#ذكريات'],
        'عام': ['#منشور', '#محتوى', '#مشاركة', '#تفاعل', '#مجتمع']
      };

      const mockAnalysis: ContentAnalysis = {
        contentType: detectedType,
        suggestedHashtags: hashtagSuggestions[detectedType as keyof typeof hashtagSuggestions] || hashtagSuggestions['عام'],
        sentiment: content.includes('!') || content.includes('رائع') || content.includes('جميل') ? 'إيجابي' : 
                  content.includes('سيء') || content.includes('مشكلة') ? 'سلبي' : 'محايد',
        topics: [detectedType, 'تفاعل اجتماعي']
      };

      setAnalysis(mockAnalysis);
      
      toast({
        title: "تم التحليل بنجاح",
        description: `تم اكتشاف محتوى من نوع: ${detectedType}`,
      });
      
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description: "حدث خطأ أثناء تحليل المحتوى",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, toast]);

  const copyHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${hashtag} إلى الحافظة`,
    });
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          فلتر المحتوى الذكي
        </CardTitle>
        <CardDescription>
          تحليل المحتوى باستخدام الذكاء الاصطناعي واقتراح الهاشتاجات المناسبة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            اكتب محتوى منشورك
          </label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب المحتوى الذي تريد تحليله..."
            className="bg-gray-800 border-gray-600 text-white min-h-24"
          />
        </div>

        <Button 
          onClick={analyzeContent}
          disabled={isAnalyzing || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              تحليل المحتوى
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-gray-300">نوع المحتوى</span>
                  </div>
                  <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-600">
                    {analysis.contentType}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">المشاعر</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      analysis.sentiment === 'إيجابي' 
                        ? 'bg-green-900/20 text-green-400 border-green-600'
                        : analysis.sentiment === 'سلبي'
                        ? 'bg-red-900/20 text-red-400 border-red-600'
                        : 'bg-yellow-900/20 text-yellow-400 border-yellow-600'
                    }`}
                  >
                    {analysis.sentiment}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">الهاشتاجات المقترحة</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggestedHashtags.map((hashtag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-900/20 text-blue-400 border-blue-600 cursor-pointer hover:bg-blue-800/30 transition-colors"
                      onClick={() => copyHashtag(hashtag)}
                    >
                      {hashtag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  اضغط على أي هاشتاج لنسخه
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-300">المواضيع المكتشفة</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-yellow-900/20 text-yellow-400 border-yellow-600"
                    >
                      {topic}
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