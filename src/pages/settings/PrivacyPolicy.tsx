import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">سياسة الخصوصية</h1>
            </div>
            <span className="text-xs text-muted-foreground mr-7">Privacy Policy</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-4 space-y-6 text-sm leading-relaxed text-foreground">
          {/* المقدمة */}
          <section className="space-y-3">
            <p className="text-muted-foreground">
              تقدّر شركة نيتورك خصوصيتك، وملتزمة بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيف نقوم بجمع واستخدام وحماية معلوماتك عند استخدامك تطبيق نيتورك، وهو تطبيق تواصل اجتماعي مشفر وآمن صُمم لحماية مستخدميه بأعلى معايير الأمان.
            </p>
          </section>

          {/* 1. سياسة البيانات */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">1. سياسة البيانات</h2>
            <p>
              المعلومات والمحتوى الذي تقدمه. نجمع المحتوى والاتصالات والمعلومات الأخرى التي تقدمها عند استخدامك لمنتجاتنا، بما في ذلك عند تسجيلك للحصول على حساب أو إنشاء محتوى أو مشاركته أو إرسال رسائل أو التواصل مع الآخرين.
            </p>
            <p>
              يمكن أن يشمل ذلك معلومات في المحتوى الذي تقدمه أو عنه (مثل البيانات الوصفية)، مثل موقع الصورة أو تاريخ إنشاء الملف. يمكن أن يشمل أيضًا ما تراه من خلال الميزات التي نقدمها، مثل الكاميرا الخاصة بنا، حتى نتمكن من القيام بأشياء مثل اقتراح أقنعة ومرشحات قد تعجبك.
            </p>
            <p>
              توضح سياسة الخصوصية هذه كيفية استخدامنا، شركة نيتورك دوت كوم المحدودة ("نيتورك")، وحماية بياناتك الشخصية التي تقدمها لنا، أو التي نحصل عليها أو ننشئها بأي طريقة أخرى، فيما يتعلق باستخدامك لخدمات المراسلة السحابية ("الخدمات").
            </p>
          </section>

          {/* 1.1 مبادئ الخصوصية */}
          <section className="space-y-3">
            <h3 className="font-bold">1.1 مبادئ الخصوصية</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>نحن لا نستخدم بياناتك لعرض الإعلانات لك.</li>
              <li>نقوم فقط بتخزين البيانات التي يحتاجها Network ليعمل كخدمة آمنة وغنية بالمميزات.</li>
            </ul>
          </section>

          {/* 2.1 المعلومات التي نقوم بجمعها */}
          <section className="space-y-3">
            <h3 className="font-bold">2.1 المعلومات التي نقوم بجمعها</h3>
            <p>نقوم بجمع أنواع محدودة من المعلومات لتوفير وتحسين خدماتنا:</p>
            
            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">أ. معلومات الحساب</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>الاسم الكامل أو اسم المستخدم</li>
                <li>البريد الإلكتروني (اختياري)</li>
                <li>رقم الهاتف (للتوثيق فقط)</li>
                <li>صورة الملف الشخصي (اختيارية)</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">ب. معلومات الاستخدام</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>النشاطات داخل التطبيق (منشورات، رسائل، تفاعلات)</li>
                <li>سجلات دخول التطبيق (لأغراض أمنية فقط)</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">ج. بيانات الجهاز</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>نوع الجهاز وإصداره</li>
                <li>نظام التشغيل</li>
                <li>عنوان الـ IP (يُستخدم لأغراض الحماية فقط، ولا يُخزن بشكل دائم)</li>
              </ul>
            </div>
          </section>

          {/* استخدام المعلومات */}
          <section className="space-y-3">
            <h3 className="font-bold">استخدام معلوماتك</h3>
            <p>تُستخدم معلوماتك لتقديم تجربة استخدام آمنة ومخصصة، وتتضمن الأهداف التالية:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>إدارة وإنشاء الحسابات</li>
              <li>تسهيل التواصل بين المستخدمين</li>
              <li>الحماية من الانتهاكات والمحتوى الضار</li>
              <li>تحسين أداء التطبيق واستقراره</li>
              <li>التحقق من هوية المستخدمين إذا لزم الأمر</li>
            </ul>
          </section>

          {/* بيانات الحساب الأساسية */}
          <section className="space-y-3">
            <h3 className="font-bold">بيانات الحساب الأساسية</h3>
            <p>
              نيتورك خدمة تواصل. لإنشاء حساب، ما عليك سوى إدخال رقم هاتفك المحمول وبيانات حسابك الأساسية (التي قد تشمل اسم الملف الشخصي، وصورة الملف الشخصي، ومعلومات حوله).
            </p>
            <p>
              لا نشترط أن يكون اسمك الحقيقي هو اسمك الحقيقي. يُرجى العلم أن المستخدمين الذين أضافوك إلى جهات اتصالهم سيرونك بالاسم الذي حفظوه وليس باسمك الحقيقي.
            </p>
          </section>

          {/* 3.1 عنوان بريدك الإلكتروني */}
          <section className="space-y-3">
            <h3 className="font-bold">3.1 عنوان بريدك الإلكتروني</h3>
            <p>
              عند تفعيل ميزة التحقق بخطوتين لحسابك أو حفظ مستنداتك باستخدام ميزة Passport، يمكنك اختيار إعداد بريد إلكتروني لاستعادة كلمة المرور. سيُستخدم هذا العنوان فقط لإرسال رمز استعادة كلمة المرور إليك في حال نسيانه. هذا صحيح: لا مجال للتسويق أو عبارات "نفتقدك".
            </p>
          </section>

          {/* 4.1 رقم الهاتف وجهات الاتصال */}
          <section className="space-y-3">
            <h3 className="font-bold">4.1 رقم الهاتف وجهات الاتصال</h3>
            <p>
              يستخدم نيتورك أرقام الهواتف كمعرفات فريدة ليسهل عليك التبديل من الرسائل النصية القصيرة وتطبيقات المراسلة الأخرى والاحتفاظ ببياناتك الاجتماعية. نطلب إذنك قبل مزامنة جهات اتصالك.
            </p>
            <p>
              نحفظ بيانات جهات اتصالك المحدثة لإعلامك فور تسجيل أحدها في نيتورك ولعرض الأسماء بشكل صحيح في الإشعارات.
            </p>
            <p>
              يمكنك دائمًا إيقاف مزامنة جهات الاتصال أو حذفها من خوادمنا في الإعدادات {'>'} الخصوصية والأمان {'>'} إعدادات البيانات.
            </p>
          </section>

          {/* التشفير والأمان */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">التشفير والأمان</h2>
            <p>نحن نأخذ أمانك على محمل الجد:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>تشفير من طرف إلى طرف (End-to-End) للرسائل الخاصة</li>
              <li>حماية بياناتك بتقنيات تخزين آمن وسيرفرات موثوقة</li>
              <li>لا يمكن لأي جهة ثالثة (بما في ذلك إدارة نيتورك) الاطلاع على محتوى محادثاتك الخاصة</li>
              <li>مراقبة مستمرة لأي محاولات اختراق أو استخدام ضار</li>
            </ul>
          </section>

          {/* مشاركة البيانات */}
          <section className="space-y-3">
            <h3 className="font-bold">مشاركة البيانات</h3>
            <p>نحن لا نبيع أو نشارك معلوماتك مع أي طرف ثالث، باستثناء:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>إذا طُلب منا قانونيًا من قبل جهة رسمية مختصة</li>
              <li>في حال الضرورة القصوى لحماية حقوق المستخدمين أو أمن النظام</li>
            </ul>
          </section>

          {/* الكوكيز */}
          <section className="space-y-3">
            <h3 className="font-bold">الكوكيز والتقنيات المشابهة</h3>
            <p>
              نستخدم تقنيات محدودة مثل الكوكيز لتحسين الأداء وتجربة المستخدم، دون تتبع شخصي أو بيع بيانات.
            </p>
          </section>

          {/* خصوصية القُصّر */}
          <section className="space-y-3">
            <h3 className="font-bold">خصوصية القُصّر</h3>
            <p>
              لا يُسمح باستخدام التطبيق لمن هم دون 13 عامًا. إذا اكتشفنا وجود حسابات لأطفال دون هذا السن، فسيتم إزالتها فورًا.
            </p>
          </section>

          {/* استخدام الذكاء الاصطناعي */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">استخدام الذكاء الاصطناعي داخل التطبيق</h2>
            <p>قد يستخدم تطبيق نيتورك تقنيات الذكاء الاصطناعي (AI) بشكل محدود لتحسين تجربة المستخدم، مثل:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>كشف المحتوى غير اللائق أو العنيف تلقائيًا</li>
              <li>تحسين جودة البحث داخل التطبيق</li>
              <li>اقتراح محتوى مخصص بناءً على اهتماماتك</li>
            </ul>
            <p className="text-primary font-medium">
              ملاحظة: لا تُستخدم خوارزميات الذكاء الاصطناعي لمراقبة محادثاتك الخاصة أو تحليلها، وهي مشفرة بالكامل.
            </p>
          </section>

          {/* حماية البيانات وفقًا للقوانين الدولية */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">حماية البيانات وفقًا للقوانين الدولية</h2>
            <p>نلتزم بالامتثال للقوانين الدولية الخاصة بالخصوصية، مثل:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>اللائحة العامة لحماية البيانات (GDPR) في الاتحاد الأوروبي</li>
              <li>قانون حماية خصوصية المستهلك (CCPA) في كاليفورنيا</li>
            </ul>
            <p>للمستخدمين داخل أوروبا، لديك الحق في:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>الوصول إلى بياناتك</li>
              <li>طلب تصحيح بيانات غير دقيقة</li>
              <li>طلب حذف بياناتك نهائيًا</li>
            </ul>
          </section>

          {/* حدود المسؤولية */}
          <section className="space-y-3">
            <h3 className="font-bold">حدود المسؤولية</h3>
            <p>
              على الرغم من أننا نستخدم تقنيات متقدمة جدًا لحماية بياناتك، إلا أن الإنترنت ليس بيئة آمنة 100%. لا نتحمل مسؤولية أي خرق خارج عن إرادتنا ناتج عن قوة قاهرة أو اختراق أمني عالمي. لكننا بالمرصاد ونلاحظ أي شيء مشكوك به.
            </p>
          </section>

          {/* الاحتفاظ بالبيانات */}
          <section className="space-y-3">
            <h3 className="font-bold">الاحتفاظ بالبيانات</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>نحتفظ بمعلومات حسابك ما دمت تستخدم التطبيق</li>
              <li>إذا حذفت حسابك، يتم حذف كافة بياناتك نهائيًا خلال مدة لا تتجاوز 30 يومًا</li>
              <li>سجلات التحقق الأمني تُحتفظ بها لفترة محددة للامتثال للقوانين</li>
            </ul>
          </section>

          {/* الإعلانات */}
          <section className="space-y-3">
            <h3 className="font-bold">الإعلانات وتتبع الطرف الثالث</h3>
            <p>
              نيتورك لا يعرض إعلانات طرف ثالث حاليًا، ولا يسمح باستخدام أدوات تتبع خارجية مثل Google Ads أو Meta Pixels داخل التطبيق. جميع أنشطتك تبقى داخل النظام المشفر والخاص.
            </p>
          </section>

          {/* خصوصيتك أولوية */}
          <section className="space-y-3 bg-primary/10 rounded-lg p-4">
            <h2 className="text-lg font-bold text-primary">خصوصيتك أولوية</h2>
            <p>نؤمن أن الخصوصية حق أساسي. لذلك:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>لن نبيع بياناتك أبدًا</li>
              <li>لن نفرض جمع بيانات غير ضرورية</li>
            </ul>
          </section>

          {/* طلبات إنفاذ القانون */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">طلبات إنفاذ القانون</h2>
            <p>
              يمكن لجهات إنفاذ القانون الحصول على معلومات من نيتورك استجابةً لأوامر قضائية. إذا كانت هناك أنشطة إجرامية تنتهك شروط خدمة نيتورك، فقد تقوم المنصة بتحليل قانوني لطلب جهات إنفاذ القانون وقد تكشف عن معلومات مثل عنوان IP ورقم الهاتف للمستخدمين المشتبه بهم.
            </p>
            <p>
              لكن هل يوافق مسؤول التطبيق على هذه الطلبات؟ بالتأكيد لا إلا بالحالة الحرجة. لكن ليس كل الحالات نوافق عليها لأن هذا أمان بيانات المستخدمين.
            </p>
            <p>
              تلتزم سياسة خصوصية نيتورك بحماية بيانات المستخدمين وخصوصيتهم. يعتمد نيتورك على التشفير الشامل للمحادثات السرية، مما يعني أن المحتوى لا يمكن لأي شخص الوصول إليه، بما في ذلك نيتورك نفسه، إلا المستخدمين المشاركين في المحادثة.
            </p>
          </section>

          {/* سياسة معالجة بلاغات المحتوى */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">سياسة معالجة بلاغات المحتوى</h2>
            <p>نحن نُتيح للمستخدمين الإبلاغ عن أي محتوى يُعتقد أنه:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>مخالف للأخلاق أو القوانين</li>
              <li>يتضمن عنف، تحرّش، كراهية أو تمييز</li>
              <li>يحتوي على روابط ضارة أو محاولات احتيال</li>
            </ul>
            <p>عند الإبلاغ:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يتم تشفير تفاصيل البلاغ وحمايتها</li>
              <li>يُراجع فريق مختص البلاغ خلال 24 إلى 72 ساعة</li>
              <li>قد يتم اتخاذ إجراءات مثل حذف المحتوى أو تعليق الحساب</li>
            </ul>
          </section>

          {/* خصوصية الرسائل والمحادثات */}
          <section className="space-y-3">
            <h3 className="font-bold">خصوصية الرسائل والمحادثات</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>كل الرسائل الخاصة في نيتورك مشفّرة من طرف لطرف (End-to-End)</li>
              <li>لا يمكن حتى لفريق نيتورك قراءة محتوياتها</li>
              <li>لا تُخزَّن الرسائل على الخوادم بعد تسليمها، إلا في حالات النسخ الاحتياطي الآمن المؤقت</li>
            </ul>
          </section>

          {/* الحذف التلقائي للحسابات */}
          <section className="space-y-3">
            <h3 className="font-bold">الحذف التلقائي للحسابات غير النشطة</h3>
            <p>لحماية بيانات المستخدمين وتقليل التخزين:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>قد يتم حذف الحسابات غير النشطة بعد 12 شهرًا من آخر استخدام</li>
              <li>سيتم إعلامك عبر البريد الإلكتروني أو الإشعارات قبل الحذف بـ30 يومًا</li>
              <li>يمكنك استعادة حسابك خلال هذه الفترة</li>
            </ul>
          </section>

          {/* التوثيق والتحقق */}
          <section className="space-y-3">
            <h3 className="font-bold">التوثيق والتحقق</h3>
            <p>لدعم الأمان، نُقدّم ميزة التوثيق بالهوية أو رقم الهاتف:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>توثيق الحسابات الرسمية أو صانعي المحتوى</li>
              <li>إضافة حماية مزدوجة عند تسجيل الدخول</li>
              <li>منع انتحال الهوية</li>
            </ul>
          </section>

          {/* حماية كلمات المرور */}
          <section className="space-y-3">
            <h3 className="font-bold">حماية كلمات المرور والمصادقة الثنائية</h3>
            <p>لحماية حسابك:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يتم تشفير كلمات المرور باستخدام تقنيات مثل bcrypt ولا يتم تخزينها كنصوص مكشوفة</li>
              <li>نوفر خيار المصادقة الثنائية (2FA) باستخدام رمز عبر رسالة أو تطبيق Google Authenticator</li>
              <li>لا تشارك بيانات تسجيل دخولك مع أي طرف، ونحن لا نطلبها منك عبر البريد أو الرسائل</li>
            </ul>
          </section>

          {/* الأمن ضد الهجمات السيبرانية */}
          <section className="space-y-3">
            <h3 className="font-bold">الأمن ضد الهجمات السيبرانية</h3>
            <p>يتم تطبيق آليات قوية للحماية من:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>هجمات DDoS أو الاختراق</li>
              <li>محاولات تسجيل دخول غير مصرح بها</li>
              <li>الوصول العشوائي إلى بيانات المستخدمين</li>
            </ul>
            <p>
              يتم تسجيل هذه الأنشطة وتحليلها فوريًا لإيقافها تلقائيًا، ونُبلغ المستخدم عند وجود خطر أمني متعلق بحسابه.
            </p>
          </section>

          {/* حقوقك القانونية */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">حقوقك القانونية الكاملة</h2>
            <p>بصفتك مستخدمًا، فإنك تتمتع بكامل الحقوق التالية:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>الحق في الوصول إلى بياناتك</li>
              <li>الحق في تصحيح معلومات خاطئة</li>
              <li>الحق في حذف بياناتك نهائيًا (Right to be forgotten)</li>
              <li>الحق في سحب الموافقة على استخدام البيانات</li>
              <li>الحق في تقديم شكوى إلى جهة تنظيم حماية البيانات في بلدك</li>
            </ul>
          </section>

          {/* سياسة المحتوى الذي ينشئه المستخدمون */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">سياسات المحتوى الذي ينشئه المستخدمون (UGC)</h2>
            <p>كمستخدم في نيتورك، يمكنك إنشاء ومشاركة المحتوى. ولهذا فإن:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>أنت المسؤول القانوني عن المحتوى الذي تنشره</li>
              <li>يجب ألا يحتوي على مواد محظورة مثل: العنف، التحريض، العنصرية، المحتوى الجنسي، أو الاحتيال</li>
              <li>نيتورك يحتفظ بالحق في إزالة أي محتوى يخالف شروط الاستخدام أو القوانين المعمول بها، دون إشعار مسبق</li>
            </ul>
          </section>

          {/* قيود الاستخدام */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">قيود الاستخدام</h2>
            <p>تُحظر الأنشطة التالية:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>محاولة اختراق التطبيق أو تعطيل خدماته</li>
              <li>استخدام التطبيق لأغراض غير قانونية (مثل الاحتيال أو التهديد)</li>
              <li>بيع أو تبادل الحسابات</li>
              <li>استخدام أدوات أو برامج خارجية للتلاعب بالنظام أو جمع بيانات المستخدمين</li>
            </ul>
          </section>

          {/* التزامات المطور */}
          <section className="space-y-3">
            <h3 className="font-bold">التزامات المطور (نيتورك)</h3>
            <p>نحن، كمطوّري تطبيق نيتورك، نلتزم بما يلي:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>عدم جمع أو استخدام بيانات المستخدمين لأي أغراض تجارية بدون موافقة</li>
              <li>الشفافية الكاملة في أي تغييرات تتعلق بسياسة الخصوصية</li>
              <li>احترام جميع القوانين الدولية الخاصة بحماية البيانات</li>
            </ul>
          </section>

          {/* سياسة حذف البيانات بعد الوفاة */}
          <section className="space-y-3">
            <h3 className="font-bold">سياسة حذف البيانات بعد الوفاة</h3>
            <p>في حال وفاة المستخدم، يمكن لعائلته أو وكيله القانوني:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>طلب حذف الحساب والبيانات بعد تقديم وثائق إثبات الهوية والوفاة</li>
              <li>أو الاحتفاظ بالحساب على شكل تذكاري (اختياري)</li>
            </ul>
          </section>

          {/* سياسة تقارير الشفافية */}
          <section className="space-y-3">
            <h3 className="font-bold">سياسة تقارير الشفافية</h3>
            <p>نيتورك يلتزم بنشر تقرير سنوي يتضمن:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>عدد الطلبات القانونية التي تلقيناها</li>
              <li>عدد الحسابات المحذوفة بسبب انتهاك السياسة</li>
              <li>إحصائيات عامة عن أمان وخصوصية المستخدمين</li>
            </ul>
          </section>

          {/* الخصوصية في بث الفيديو المباشر */}
          <section className="space-y-3">
            <h3 className="font-bold">الخصوصية في بث الفيديو المباشر (Live)</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>لا يتم تسجيل أو تخزين البث إلا إذا فعّل المستخدم خيار الحفظ</li>
              <li>لا يمكن للمستخدمين الآخرين تنزيل البث بدون إذن</li>
              <li>يمكن الإبلاغ عن أي بث مسيء، ويتم إيقافه مباشرةً عند التحقق</li>
            </ul>
          </section>

          {/* سياسة استعادة الحساب */}
          <section className="space-y-3">
            <h3 className="font-bold">سياسة استعادة الحساب</h3>
            <p>في حال فقدان الوصول إلى الحساب (نسيان الرقم، تغيير الجهاز)، يمكنك استعادته عبر:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>رقم الهاتف المرتبط</li>
              <li>البريد الإلكتروني (إذا أُضيف مسبقًا)</li>
              <li>توثيق الهوية (في الحالات الحساسة)</li>
            </ul>
          </section>

          {/* سياسة مكافحة الحسابات المزيفة */}
          <section className="space-y-3">
            <h3 className="font-bold">سياسة مكافحة الحسابات المزيفة</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يتم فحص الحسابات الجديدة تلقائيًا للكشف عن نشاطات مشبوهة</li>
              <li>الحسابات التي تنشر روابط مزيفة أو تتكرر منها الشكاوى تُعلّق مؤقتًا أو تُحذف</li>
              <li>يمكن تقديم استئناف من خلال نموذج رسمي داخل التطبيق</li>
            </ul>
          </section>

          {/* مراقبة الأداء */}
          <section className="space-y-3">
            <h3 className="font-bold">مراقبة الأداء دون تتبع</h3>
            <p>نيتورك يجمع إحصائيات استخدام غير مرتبطة بالمستخدم شخصيًا بهدف:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>تحسين الأداء والسرعة</li>
              <li>تحليل الأعطال وتحسين واجهات المستخدم</li>
            </ul>
            <p>لا يتم استخدام هذه البيانات في الإعلانات أو التسويق.</p>
          </section>

          {/* سياسة الإعلانات */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">سياسة الإعلانات في تطبيق نيتورك</h2>
            
            <h4 className="font-semibold">1. الغرض من الإعلانات</h4>
            <p>يتيح تطبيق نيتورك عرض الإعلانات ضمن المحتوى بهدف:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>دعم استمرارية المنصة وتغطية تكاليف التشغيل</li>
              <li>تمكين المستخدمين والمعلنين من الترويج لخدماتهم ومنتجاتهم بشكل آمن وشفاف</li>
              <li>تحسين تجربة المستخدم عبر إعلانات مخصصة تلائم اهتماماته</li>
            </ul>

            <h4 className="font-semibold mt-4">2. أنواع الإعلانات المسموح بها</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>إعلانات المنتجات والخدمات التجارية الموثوقة</li>
              <li>إعلانات التطبيقات والمواقع الإلكترونية المصرّح بها</li>
              <li>الحملات الاجتماعية أو التوعوية المرخصة</li>
            </ul>

            <h4 className="font-semibold mt-4">3. الإعلانات المحظورة</h4>
            <p>يُمنع تمامًا نشر أو عرض أي إعلان يحتوي على:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>محتوى إباحي أو خادش للحياء</li>
              <li>عنف، كراهية، تمييز، أو تحريض</li>
              <li>معلومات مضللة أو احتيالية</li>
              <li>برامج أو روابط ضارة</li>
              <li>الترويج للمقامرة أو بيع الأسلحة أو المخدرات</li>
              <li>الإعلانات السياسية أو الدينية غير المرخصة</li>
            </ul>
          </section>

          {/* سياسة المحتوى المدفوع والمشتركين المميزين */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">سياسة المحتوى المدفوع والمشتركين المميزين (VIP)</h2>
            
            <h4 className="font-semibold">1. تعريف العضوية المميزة (VIP)</h4>
            <p>العضوية المميزة في تطبيق نيتورك هي خدمة اشتراك مدفوعة تمنح المستخدمين مزايا إضافية، مثل:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>الوصول إلى محتوى حصري أو مميز</li>
              <li>ميزات تفاعلية إضافية داخل التطبيق</li>
              <li>زيادة في الأرباح أو معدل الظهور</li>
              <li>إزالة الإعلانات أو تخفيضها</li>
              <li>أدوات مخصصة لتحسين الحساب أو إدارة المحتوى</li>
            </ul>

            <h4 className="font-semibold mt-4">2. الاشتراك والدفع</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يمكن الاشتراك عبر وسائل الدفع المعتمدة في التطبيق</li>
              <li>تبدأ فترة الاشتراك من تاريخ الدفع</li>
              <li>يتم التجديد التلقائي ما لم يقم المستخدم بإلغائه</li>
            </ul>

            <h4 className="font-semibold mt-4">3. سياسة الإلغاء والاسترجاع</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>يمكن للمستخدم إلغاء اشتراكه في أي وقت</li>
              <li>المبالغ المدفوعة غير قابلة للاسترجاع بعد تفعيل الخدمة</li>
            </ul>
          </section>

          {/* برنامج صناع المحتوى */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">برنامج صناع المحتوى المحترفين</h2>
            <p>لتمييز المستخدمين المميزين (المؤثرين أو صانعي المحتوى النشطين):</p>
            
            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">🏅 الشارات والمستويات</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>شارات خاصة مثل: "مبدع الأسبوع" – "نجم نيتورك" – "صانع محتوى ذهبي"</li>
                <li>مستويات تصاعدية: مبتدئ 🟢 → ناشط 🔵 → محترف 🟣 → مبدع ذهبي 🟡</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">💰 مميزات حصرية</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>زيادة الأرباح/النقاط</li>
                <li>الوصول المبكر للميزات الجديدة</li>
                <li>أولوية في الدعم الفني والتوثيق</li>
                <li>لوحة تحكم مفصلة لبيانات الأداء</li>
              </ul>
            </div>

            <div className="bg-card rounded-lg p-3 space-y-2">
              <h4 className="font-semibold">🌟 الظهور المميز</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>عرض منشوراتهم ضمن قسم "المميزين"</li>
                <li>إشارة نارية 🔥 بجانب الاسم</li>
                <li>تأثير بصري مميز على البروفايل</li>
              </ul>
            </div>
          </section>

          {/* بنود إخلاء المسؤولية */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">بنود إخلاء المسؤولية العامة</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>نيتورك ليس مسؤولًا عن التصرفات الفردية للمستخدمين أو محتوياتهم الشخصية</li>
              <li>تقع مسؤولية حماية حسابك واختيار كلمة سر قوية على عاتقك</li>
              <li>نحن لا نضمن توفر الخدمة في جميع الأوقات بسبب ظروف تقنية أو صيانة دورية</li>
            </ul>
          </section>

          {/* قبولك لهذه السياسة */}
          <section className="space-y-3 bg-primary/10 rounded-lg p-4">
            <h2 className="text-lg font-bold text-primary">قبولك لهذه السياسة</h2>
            <p>
              باستخدامك تطبيق نيتورك، فإنك تقر بأنك قرأت هذه السياسة ووافقت عليها. إذا كنت لا توافق على أي جزء منها، يُرجى عدم استخدام التطبيق.
            </p>
          </section>


          {/* التحديثات */}
          <section className="space-y-3">
            <h3 className="font-bold">التعديلات على سياسة الخصوصية</h3>
            <p>
              قد نقوم بتحديث هذه السياسة عند الحاجة. سيتم إعلامك بأي تعديل جوهري داخل التطبيق أو عبر البريد الإلكتروني.
            </p>
          </section>

          <div className="h-8" />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicy;
