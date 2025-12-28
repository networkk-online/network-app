import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Lock, Eye, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyCenter = () => {
  const navigate = useNavigate();

  const privacyTopics = [
    {
      icon: Lock,
      title: 'أمان الحساب',
      description: 'حماية حسابك وتأمينه',
      items: [
        'استخدم كلمة مرور قوية',
        'فعّل التحقق بخطوتين',
        'راجع جلسات تسجيل الدخول بانتظام',
      ],
    },
    {
      icon: Eye,
      title: 'خصوصية البيانات',
      description: 'كيف نتعامل مع بياناتك',
      items: [
        'نحن لا نبيع بياناتك الشخصية',
        'يمكنك تنزيل نسخة من بياناتك',
        'بياناتك مشفرة ومحمية',
      ],
    },
    {
      icon: Shield,
      title: 'التحكم في الخصوصية',
      description: 'إدارة إعدادات الخصوصية',
      items: [
        'تحكم في من يرى منشوراتك',
        'إدارة الحسابات المحظورة',
        'تصفية التعليقات والرسائل',
      ],
    },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">مركز الخصوصية</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <p className="text-sm text-muted-foreground">
          نحن ملتزمون بحماية خصوصيتك وأمان بياناتك
        </p>

        {privacyTopics.map((topic, index) => (
          <div key={index} className="bg-card rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <topic.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">{topic.title}</h3>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {topic.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Quick Links */}
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-bold mb-4">روابط سريعة</h3>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/settings/privacy')}
            >
              <span>إعدادات الخصوصية</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/settings/blocked')}
            >
              <span>الحسابات المحظورة</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => navigate('/settings/archive')}
            >
              <span>تنزيل بياناتك</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Policy Links */}
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-bold">السياسات والشروط</h3>
          </div>
          <div className="space-y-2 text-sm">
            <button 
              className="block text-primary hover:underline"
              onClick={() => navigate('/settings/privacy-policy')}
            >
              سياسة الخصوصية - Privacy Policy
            </button>
            <button className="block text-primary hover:underline">
              شروط الاستخدام
            </button>
            <button className="block text-primary hover:underline">
              إرشادات المجتمع
            </button>
          </div>
        </div>

        {/* حذف الحساب */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <h3 className="font-bold text-destructive mb-3">حذف الحساب - Delete Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            إذا كنت ترغب في حذف حسابك نهائياً، سيتم حذف جميع بياناتك خلال 30 يومًا.
          </p>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => navigate('/settings/delete-account')}
          >
            حذف الحساب
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyCenter;
