import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Mail, Flag } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

const ChildSafety = () => {
  useEffect(() => {
    document.title = 'معايير سلامة الأطفال • NETWORKK';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'سياسة نيتورك أونلاين لسلامة الأطفال ومكافحة الاستغلال والاعتداء.';
    if (meta) meta.setAttribute('content', desc);
  }, []);

  const today = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  const prohibited = [
    'نشر أو مشاركة أو طلب مواد الاعتداء الجنسي على الأطفال.',
    'استدراج الأطفال أو محاولة التواصل معهم لأغراض جنسية.',
    'الابتزاز الجنسي أو التهديد أو الاستغلال.',
    'الاتجار بالأطفال أو الترويج لأي نشاط يعرّضهم للخطر.',
    'أي محتوى يشجع أو يسهّل الاعتداء على الأطفال أو استغلالهم.',
  ];

  const actions = [
    'إزالة المحتوى المخالف.',
    'تعليق أو حظر الحساب المخالف.',
    'الاحتفاظ بالمعلومات الضرورية للتحقيق وفقًا للقانون.',
    'التعاون مع الجهات المختصة والسلطات المحلية والوطنية عند الحاجة.',
    'الالتزام بجميع قوانين سلامة الأطفال المعمول بها.',
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#080808] text-white/90">
      <header className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-white/60 hover:text-[#00e676] transition">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-sm">الرئيسية</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30 mb-4">
            <ShieldCheck className="h-8 w-8 text-[#00e676]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">معايير سلامة الأطفال في نيتورك أونلاين</h1>
          <p className="text-white/50 text-sm">آخر تحديث: {today}</p>
        </div>

        <div className="space-y-6">
          <section className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <p className="text-white/80 leading-loose">
              يلتزم تطبيق نيتورك أونلاين بتوفير بيئة آمنة لجميع المستخدمين، ويمنع منعًا باتًا أي محتوى أو نشاط يتضمن الاعتداء الجنسي على الأطفال أو استغلالهم أو تعريضهم للخطر.
            </p>
          </section>

          <section className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-[#00e676] font-semibold mb-4 text-lg">المحتوى المحظور</h2>
            <p className="text-white/60 text-sm mb-3">يشمل المحتوى المحظور، على سبيل المثال لا الحصر:</p>
            <ul className="space-y-2 text-white/80">
              {prohibited.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#00e676] mt-2">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-[#0d0d0d]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-[#00e676] font-semibold mb-4 text-lg">الإجراءات المتخذة</h2>
            <p className="text-white/60 text-sm mb-3">
              عند استلام بلاغ موثوق، يقوم فريق نيتورك أونلاين بمراجعة المحتوى واتخاذ الإجراءات المناسبة، وقد تشمل:
            </p>
            <ul className="space-y-2 text-white/80">
              {actions.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#00e676] mt-2">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-[#0d0d0d]/80 border border-[#00e676]/20 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-[#00e676] font-semibold mb-4 text-lg flex items-center gap-2">
              <Flag className="h-5 w-5" />
              الإبلاغ عن المخالفات
            </h2>
            <p className="text-white/80 leading-loose mb-4">
              يمكن للمستخدمين الإبلاغ عن أي محتوى أو حساب أو سلوك يثير مخاوف تتعلق بسلامة الأطفال من داخل التطبيق باستخدام خيار "إبلاغ" واختيار سبب "استغلال الأطفال".
            </p>
            <a
              href="mailto:info@networkk.online"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#00e676]/10 border border-[#00e676]/40 text-[#00e676] hover:bg-[#00e676]/20 transition"
            >
              <Mail className="h-4 w-4" />
              <span dir="ltr">info@networkk.online</span>
            </a>
            <p className="text-white/50 text-xs mt-4">
              يتم التعامل مع البلاغات المتعلقة بسلامة الأطفال بأولوية عالية وسرية مناسبة.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ChildSafety;
