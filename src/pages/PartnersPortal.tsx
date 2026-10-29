import { ArrowLeft, ArrowUpRight, BadgeCheck, Building2, ChartNoAxesCombined, CircleDollarSign, Handshake, Instagram, ShieldCheck, Store, Users, Video } from "lucide-react";
import { useState } from "react";
import "./PartnersPortal.css";

const partnerTypes = [
  { icon: Video, title: "صنّاع المحتوى", description: "عرّف الجمهور على نيتورك اونلاين وساعد المبدعين على اكتشاف منصتنا." },
  { icon: Store, title: "المتاجر والمحلات", description: "وسّع شبكة المتاجر الشريكة واربط أصحاب الأعمال بفرص جديدة." },
  { icon: Building2, title: "الشركات والمؤسسات", description: "ابنِ علاقات تجارية وساعد الشركات على الوصول إلى جمهورها." },
];

const benefits = [
  { icon: CircleDollarSign, title: "مكافآت واضحة", description: "آلية احتساب معلنة للإحالات المؤهلة، بعد اعتمادها من الإدارة." },
  { icon: ChartNoAxesCombined, title: "متابعة الأداء", description: "مساحة مخصصة لمتابعة إحالاتك وحالة كل طلب عند تفعيل لوحة الشركاء." },
  { icon: ShieldCheck, title: "نظام موثوق", description: "مراجعة للطلبات ومنع الإحالات الوهمية وحماية حقوق الشريك." },
  { icon: Handshake, title: "شراكة طويلة الأمد", description: "تعاون مبني على الثقة والنمو الحقيقي، وليس على التسجيلات الوهمية." },
];

export default function PartnersPortal() {
  const [selectedType, setSelectedType] = useState("صانع محتوى");
  const [notice, setNotice] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(true);
  }

  return (
    <main className="partners-portal" dir="rtl">
      <header className="pp-header">
        <a className="pp-brand" href="/" aria-label="نيتورك اونلاين">
          <img src="/icon-512.png" alt="شعار نيتورك اونلاين" />
          <span><strong>نيتورك اونلاين</strong><small>بوابة الشركاء والوكلاء</small></span>
        </a>
        <nav className="pp-nav" aria-label="التنقل الرئيسي">
          <a href="#benefits">المزايا</a><a href="#how">آلية العمل</a><a href="#faq">الأسئلة الشائعة</a>
        </nav>
        <a className="pp-header-cta" href="#apply">قدّم طلب شراكة <ArrowLeft size={16} /></a>
      </header>

      <section className="pp-hero">
        <div className="pp-hero-copy">
          <span className="pp-eyebrow"><span /> من العراق إلى العالم</span>
          <h1>خلّينا نكبر<br /><em>نيتورك اونلاين</em> سويّة</h1>
          <p>انضم إلى شبكة شركاء نيتورك اونلاين. ساعد صنّاع المحتوى والمتاجر والشركات على الوصول إلى المنصة، وابنِ شراكة تقوم على الإحالات المؤهلة والشفافية.</p>
          <div className="pp-actions">
            <a className="pp-btn pp-btn-gold" href="#apply">ابدأ طلب الشراكة <ArrowLeft size={18} /></a>
            <a className="pp-btn pp-btn-outline" href="#how">اكتشف آلية العمل</a>
          </div>
          <div className="pp-trust"><BadgeCheck size={17} /><span>طلبات تُراجع قبل اعتماد الشراكة</span><i /> <ShieldCheck size={17} /><span>لا مكافآت للتسجيلات الوهمية</span></div>
        </div>
        <div className="pp-hero-visual" aria-label="معاينة توضيحية للوحة الشركاء">
          <div className="pp-orbit pp-orbit-one" /><div className="pp-orbit pp-orbit-two" />
          <div className="pp-dashboard">
            <div className="pp-dash-top"><div className="pp-mini-brand"><img src="/icon-512.png" alt="" /> نيتورك اونلاين</div><span className="pp-status"><i /> بوابة الشركاء</span></div>
            <div className="pp-welcome"><small>مساحة الشريك</small><h3>كل إحالة إلها مسار واضح</h3><p>تابع طلباتك بعد اعتماد حسابك.</p></div>
            <div className="pp-dash-cards"><div><Users /><small>الإحالات</small><b>—</b><span>تُعرض بعد التفعيل</span></div><div><BadgeCheck /><small>الطلبات المعتمدة</small><b>—</b><span>تُعرض بعد التفعيل</span></div></div>
            <div className="pp-chart"><div><strong>متابعة الأداء</strong><small>معاينة توضيحية</small></div><svg viewBox="0 0 440 100" role="img" aria-label="رسم توضيحي للأداء"><path d="M0 78 C35 72 40 42 80 55 S130 75 165 38 S215 68 250 42 S305 56 335 27 S395 49 440 12" fill="none" stroke="#08a045" strokeWidth="3" strokeLinecap="round"/><path d="M0 78 C35 72 40 42 80 55 S130 75 165 38 S215 68 250 42 S305 56 335 27 S395 49 440 12 L440 100 L0 100Z" fill="url(#pp-fill)" opacity=".25"/><defs><linearGradient id="pp-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#08a045"/><stop offset="1" stopColor="#08a045" stopOpacity="0"/></linearGradient></defs></svg></div>
            <div className="pp-dash-bottom"><span><i /> آمن</span><span>واجهة تجريبية — ليست بيانات فعلية</span></div>
          </div>
          <div className="pp-float-card"><span className="pp-float-icon"><Handshake size={20} /></span><div><strong>شراكة موثوقة</strong><small>نمو حقيقي للطرفين</small></div></div>
        </div>
      </section>

      <section className="pp-partner-types" id="how">
        <div className="pp-section-heading"><span className="pp-eyebrow">من نبحث عنه؟</span><h2>مكانك ويّانا، مهما كان مجالك</h2><p>اختر المجال الذي يناسبك وابدأ ببناء علاقات مفيدة للمنصة ولجمهورك.</p></div>
        <div className="pp-type-grid">{partnerTypes.map((item) => <article className="pp-type-card" key={item.title}><span className="pp-type-icon"><item.icon size={23} /></span><h3>{item.title}</h3><p>{item.description}</p><a href="#apply">قدّم كشريك <ArrowUpRight size={16} /></a></article>)}</div>
      </section>

      <section className="pp-benefits" id="benefits">
        <div className="pp-section-heading"><span className="pp-eyebrow">شراكة بشروط واضحة</span><h2>كل خطوة محسوبة وواضحة</h2><p>نبدأ بأساس منظم حتى يعرف كل شريك مسؤولياته وكيف تُراجع الإحالات.</p></div>
        <div className="pp-benefit-grid">{benefits.map((item) => <article className="pp-benefit" key={item.title}><span><item.icon size={21} /></span><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>
      </section>

      <section className="pp-steps">
        <div className="pp-section-heading"><span className="pp-eyebrow">ببساطة ووضوح</span><h2>شلون تصير شريك؟</h2></div>
        <div className="pp-step-grid"><article><b>01</b><h3>قدّم طلبك</h3><p>عرّفنا بنفسك وبمجال عملك ووسائل التواصل المتاحة.</p></article><article><b>02</b><h3>مراجعة الطلب</h3><p>يراجع الفريق المعلومات ويتواصل معك عند الحاجة.</p></article><article><b>03</b><h3>ابدأ الإحالات</h3><p>بعد الموافقة وتفعيل النظام، شارك الإحالات وتابع حالتها.</p></article></div>
      </section>

      <section className="pp-apply" id="apply">
        <div className="pp-apply-copy"><span className="pp-eyebrow">ابدأ من هنا</span><h2>خلّينا نتعرّف عليك</h2><p>اختَر نوع الشراكة وأكمل بياناتك الأولية. نموذج التقديم هنا واجهة أولية؛ إرسال الطلبات وحفظها يحتاج ربطه بنظام الشركاء قبل الإطلاق.</p><div className="pp-apply-note"><ShieldCheck size={19} /><span>لن نعرض أرقام مستخدمين أو عمولات غير مؤكدة. تفاصيل المكافآت تُعلن بعد اعتماد سياسة الشركاء.</span></div></div>
        <form className="pp-form" onSubmit={handleSubmit}>
          <label>نوع الشراكة</label><div className="pp-type-select">{["صانع محتوى", "وكيل رقمي", "متجر / محل", "شركة / مؤسسة"].map(type => <button key={type} type="button" className={selectedType === type ? "selected" : ""} onClick={() => { setSelectedType(type); setNotice(false); }}>{type}</button>)}</div>
          <label htmlFor="pp-name">الاسم أو اسم النشاط</label><input id="pp-name" name="name" required placeholder="اكتب الاسم هنا" />
          <label htmlFor="pp-contact">رقم الهاتف أو وسيلة التواصل</label><input id="pp-contact" name="contact" required placeholder="رقم الهاتف أو رابط حسابك" />
          <label htmlFor="pp-area">المحافظة / البلد</label><input id="pp-area" name="area" required placeholder="مثلاً: بغداد، العراق" />
          <label htmlFor="pp-details">نبذة مختصرة (اختياري)</label><textarea id="pp-details" name="details" rows={3} placeholder="خبرنا عن جمهورك أو نشاطك" />
          <button className="pp-btn pp-btn-gold pp-submit" type="submit">مراجعة بيانات الطلب <ArrowLeft size={18} /></button>
          {notice && <p className="pp-form-notice" role="status">هذه معاينة للنموذج فقط؛ لم تُرسل أو تُحفظ بياناتك. سنربطه بنظام الطلبات قبل نشر الموقع.</p>}
        </form>
      </section>

      <section className="pp-faq" id="faq"><div className="pp-section-heading"><span className="pp-eyebrow">أسئلة شائعة</span><h2>قبل ما تبدأ</h2></div><div className="pp-faq-list"><details><summary>هل التسجيل يعني قبول الشراكة؟</summary><p>لا. كل طلب يحتاج مراجعة وموافقة قبل تفعيل صلاحيات الشريك.</p></details><details><summary>شلون تنحسب المكافآت؟</summary><p>تُحدد المكافآت في سياسة واضحة، وتُحتسب للإحالات المؤهلة بعد التحقق والاعتماد فقط. القيم النهائية لم تُحدد بعد.</p></details><details><summary>هل أحتاج محل أو شركة مسجلة؟</summary><p>يعتمد ذلك على نوع الشراكة ومتطلباتها؛ يوضح فريق نيتورك اونلاين الشروط قبل اعتماد الطلب.</p></details><details><summary>هل لوحة الشريك جاهزة الآن؟</summary><p>التصميم الحالي واجهة أولية. تسجيل الدخول، حفظ الطلبات، تتبع الإحالات والعمولات تحتاج إلى تنفيذ وربط آمن قبل الإطلاق.</p></details></div></section>

      <footer className="pp-footer"><a className="pp-brand" href="/"><img src="/icon-512.png" alt="" /><span><strong>نيتورك اونلاين</strong><small>من العراق إلى العالم</small></span></a><p>بوابة الشركاء والوكلاء — نسخة أولية قيد التطوير</p><a href="/">العودة إلى التطبيق <ArrowLeft size={15} /></a></footer>
    </main>
  );
}
