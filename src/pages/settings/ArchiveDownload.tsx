import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, Archive, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const ArchiveDownload = () => {
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);

  const handleRequestData = async () => {
    setRequesting(true);
    // Simulate data request
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRequesting(false);
    toast({
      title: "تم إرسال الطلب",
      description: "سيتم إرسال رابط التنزيل إلى بريدك الإلكتروني خلال 48 ساعة",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">الأرشفة والتنزيل</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Download Data Section */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-bold">تنزيل بياناتك</h3>
              <p className="text-sm text-muted-foreground">
                احصل على نسخة من معلوماتك
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            يمكنك طلب نسخة من بياناتك تتضمن منشوراتك، تعليقاتك، رسائلك، ومعلومات ملفك الشخصي.
          </p>
          <Button 
            onClick={handleRequestData} 
            disabled={requesting}
            className="w-full"
          >
            {requesting ? 'جاري الطلب...' : 'طلب تنزيل البيانات'}
          </Button>
        </div>

        {/* Archive Section */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Archive className="w-6 h-6 text-primary" />
            <div>
              <h3 className="font-bold">أرشيف القصص</h3>
              <p className="text-sm text-muted-foreground">
                قصصك المنتهية الصلاحية
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            يتم حفظ قصصك تلقائياً في الأرشيف بعد انتهاء مدتها (24 ساعة).
          </p>
          <Button variant="outline" className="w-full">
            عرض أرشيف القصص
          </Button>
        </div>

        {/* Data Info */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
            <h3 className="font-bold">ما يتضمنه التنزيل</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              المنشورات والصور والفيديوهات
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              القصص والريلز
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              التعليقات والإعجابات
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              الرسائل المباشرة
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              معلومات الملف الشخصي
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <p>قد يستغرق إعداد البيانات حتى 48 ساعة</p>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDownload;
