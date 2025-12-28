import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const DeleteAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h1 className="text-xl font-bold">حذف الحساب</h1>
            </div>
            <span className="text-xs text-muted-foreground mr-7">Delete Account</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20">
          {/* تحذير */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-destructive mb-2">تحذير مهم</h3>
                <p className="text-sm text-muted-foreground">
                  حذف حسابك هو إجراء دائم ولا يمكن التراجع عنه. يرجى قراءة المعلومات أدناه بعناية قبل المتابعة.
                </p>
              </div>
            </div>
          </div>

          {/* ماذا يحدث عند حذف الحساب */}
          <div className="bg-card rounded-xl p-4 space-y-4">
            <h3 className="font-bold">ماذا يحدث عند حذف الحساب؟</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">سيتم حذف جميع منشوراتك وصورك ومقاطع الفيديو الخاصة بك نهائياً</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">سيتم حذف جميع رسائلك ومحادثاتك</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">سيتم إلغاء متابعتك لجميع الحسابات وإلغاء متابعيك</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">لن تتمكن من استعادة حسابك بعد الحذف النهائي</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">سيتم فقدان أي أرباح أو رصيد غير مسحوب</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">سيتم حذف جميع القصص والريلز الخاصة بك</span>
              </li>
            </ul>
          </div>

          {/* مدة الحذف */}
          <div className="bg-card rounded-xl p-4 space-y-3">
            <h3 className="font-bold">مدة الحذف</h3>
            <p className="text-sm text-muted-foreground">
              بعد تأكيد طلب الحذف، سيتم حذف جميع بياناتك الشخصية والمحتوى المرتبط بحسابك خلال <strong className="text-foreground">30 يومًا</strong> من تاريخ الطلب.
            </p>
            <p className="text-sm text-muted-foreground">
              خلال هذه الفترة، يمكنك إلغاء طلب الحذف عن طريق تسجيل الدخول مرة أخرى.
            </p>
          </div>

          {/* بدائل الحذف */}
          <div className="bg-card rounded-xl p-4 space-y-3">
            <h3 className="font-bold">بدائل حذف الحساب</h3>
            <p className="text-sm text-muted-foreground mb-3">
              قبل حذف حسابك، قد ترغب في النظر في هذه البدائل:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">تعطيل الحساب مؤقتاً بدلاً من حذفه نهائياً</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">تغيير إعدادات الخصوصية لتقييد الوصول إلى حسابك</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm text-muted-foreground">تنزيل نسخة من بياناتك قبل الحذف</span>
              </li>
            </ul>
          </div>

          {/* تنزيل البيانات */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <h3 className="font-bold mb-2">تنزيل بياناتك أولاً</h3>
            <p className="text-sm text-muted-foreground mb-3">
              ننصحك بتنزيل نسخة من بياناتك قبل حذف حسابك.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/settings/archive')}
            >
              تنزيل نسخة من البيانات
            </Button>
          </div>

          {/* زر الحذف */}
          <div className="space-y-4">
            <Button
              variant="destructive"
              className="w-full py-6 text-base"
              onClick={() => navigate('/settings/account-status')}
            >
              متابعة حذف الحساب
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              بالضغط على الزر أعلاه، ستتم إعادة توجيهك لتأكيد هوية حسابك قبل الحذف.
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DeleteAccount;
