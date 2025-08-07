import { Bell, MessageSquare, Heart, UserPlus, AtSign, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useInteractiveNotifications } from '@/hooks/useInteractiveNotifications';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const InteractiveNotifications = () => {
  const {
    permission,
    requestPermission,
    sendTestNotification,
    isSupported
  } = useInteractiveNotifications();
  
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true
  });

  const handleToggleNotification = (type: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    
    toast({
      title: "تم التحديث",
      description: `تم ${notificationSettings[type] ? 'إلغاء' : 'تفعيل'} إشعارات ${getNotificationLabel(type)}`,
    });
  };

  const getNotificationLabel = (type: string) => {
    const labels = {
      likes: 'الإعجابات',
      comments: 'التعليقات',
      follows: 'المتابعات',
      mentions: 'الإشارات',
      messages: 'الرسائل'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'مفعل', color: 'bg-green-500', icon: '✅' };
      case 'denied':
        return { text: 'مرفوض', color: 'bg-red-500', icon: '❌' };
      default:
        return { text: 'في الانتظار', color: 'bg-yellow-500', icon: '⏳' };
    }
  };

  if (!isSupported) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Bell className="w-5 h-5" />
            غير مدعوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            متصفحك لا يدعم الإشعارات التفاعلية. جرب متصفح حديث.
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = getPermissionStatus();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* حالة الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              الإشعارات التفاعلية
            </div>
            <Badge className={`${status.color} text-white`}>
              {status.icon} {status.text}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {permission !== 'granted' && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">🚀 مميزات الإشعارات التفاعلية:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• رد مباشر من الإشعار بدون فتح التطبيق</li>
                <li>• إعجاب سريع بنقرة واحدة</li>
                <li>• معاينة الصور والمحتوى فوراً</li>
                <li>• متابعة متبادلة من الإشعار</li>
                <li>• رد سريع على الرسائل</li>
              </ul>
              
              <Button 
                onClick={requestPermission}
                className="w-full mt-4"
                size="lg"
              >
                🔔 تفعيل الإشعارات التفاعلية
              </Button>
            </div>
          )}

          {permission === 'granted' && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ✅ الإشعارات التفاعلية مفعلة! يمكنك الآن التفاعل مباشرة من الإشعارات.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إعدادات أنواع الإشعارات */}
      {permission === 'granted' && (
        <Card>
          <CardHeader>
            <CardTitle>⚙️ إعدادات الإشعارات</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {Object.entries(notificationSettings).map(([key, enabled]) => {
              const icons = {
                likes: <Heart className="w-4 h-4" />,
                comments: <MessageSquare className="w-4 h-4" />,
                follows: <UserPlus className="w-4 h-4" />,
                mentions: <AtSign className="w-4 h-4" />,
                messages: <Send className="w-4 h-4" />
              };

              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {icons[key as keyof typeof icons]}
                    <Label htmlFor={key} className="font-medium">
                      {getNotificationLabel(key)}
                    </Label>
                  </div>
                  
                  <Switch
                    id={key}
                    checked={enabled}
                    onCheckedChange={() => handleToggleNotification(key as keyof typeof notificationSettings)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* اختبار الإشعارات */}
      {permission === 'granted' && (
        <Card>
          <CardHeader>
            <CardTitle>🧪 اختبار الإشعارات</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => sendTestNotification('like')}
                className="flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                إعجاب
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestNotification('comment')}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                تعليق
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestNotification('follow')}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                متابعة
              </Button>
              
              <Button
                variant="outline"
                onClick={() => sendTestNotification('message')}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                رسالة
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-3 text-center">
              انقر على أي زر لاختبار الإشعار التفاعلي
            </p>
          </CardContent>
        </Card>
      )}

      {/* دليل الاستخدام */}
      <Card>
        <CardHeader>
          <CardTitle>📖 كيفية الاستخدام</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-primary font-semibold">1.</span>
              <span>عند وصول إشعار، ستظهر أزرار التفاعل مباشرة</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-primary font-semibold">2.</span>
              <span>اضغط "رد" للكتابة مباشرة من الإشعار</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-primary font-semibold">3.</span>
              <span>اضغط "إعجاب" للتفاعل السريع</span>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-primary font-semibold">4.</span>
              <span>اضغط "عرض" لفتح المحتوى كاملاً</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveNotifications;