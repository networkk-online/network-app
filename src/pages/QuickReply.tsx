import { useState, useEffect } from 'react';
import { X, Reply, Heart, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface QuickReplyData {
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
}

const QuickReply = () => {
  const [replyData, setReplyData] = useState<QuickReplyData | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // استخراج البيانات من URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');
    const userId = urlParams.get('userId');

    if (postId && userId) {
      // في التطبيق الحقيقي، ستحتاج لجلب البيانات من API
      setReplyData({
        postId,
        userId,
        userName: 'أحمد محمد',
        userAvatar: '/placeholder.svg',
        content: 'هذا منشور رائع! شكراً لك على المشاركة.',
        image: '/placeholder.svg'
      });
    }
  }, []);

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyData) return;

    setIsLoading(true);
    
    try {
      // محاكاة إرسال الرد
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "✅ تم الإرسال",
        description: "تم إرسال ردك بنجاح",
      });

      // إغلاق النافذة بعد الإرسال
      setTimeout(() => {
        window.close();
      }, 1500);
      
    } catch (error) {
      toast({
        title: "❌ خطأ",
        description: "فشل في إرسال الرد",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: 'like' | 'view') => {
    if (!replyData) return;

    setIsLoading(true);
    
    try {
      if (action === 'like') {
        // محاكاة الإعجاب
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({
          title: "❤️ تم الإعجاب",
          description: "تم تسجيل إعجابك بالمنشور",
        });
      } else if (action === 'view') {
        // فتح المنشور في نافذة جديدة
        window.open(`/post/${replyData.postId}`, '_blank');
        window.close();
      }
    } catch (error) {
      toast({
        title: "❌ خطأ",
        description: "فشل في تنفيذ العملية",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!replyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">جاري تحميل البيانات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* شريط العنوان */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">💬 رد سريع</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.close()}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* المنشور الأصلي */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={replyData.userAvatar} />
                <AvatarFallback>
                  {replyData.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="font-medium">{replyData.userName}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {replyData.content}
                </p>
                
                {replyData.image && (
                  <img
                    src={replyData.image}
                    alt="صورة المنشور"
                    className="mt-2 rounded-lg max-w-full h-32 object-cover"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أزرار التفاعل السريع */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleQuickAction('like')}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4" />
            إعجاب
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleQuickAction('view')}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            عرض كامل
          </Button>
        </div>

        {/* نموذج الرد */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">اكتب ردك:</label>
              
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك هنا..."
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  اضغط Enter للإرسال
                </span>
                
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isLoading}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Reply className="w-4 h-4" />
                  {isLoading ? 'جاري الإرسال...' : 'إرسال'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ردود اقتراحية سريعة */}
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">ردود سريعة:</label>
            
            <div className="grid grid-cols-1 gap-2">
              {[
                'رائع! 👏',
                'شكراً لك ❤️',
                'أعجبني هذا 😍',
                'متفق معك تماماً 💯',
                'مشاركة ممتازة 🔥'
              ].map((quickReply, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyText(quickReply)}
                  disabled={isLoading}
                  className="justify-start text-sm"
                >
                  {quickReply}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickReply;