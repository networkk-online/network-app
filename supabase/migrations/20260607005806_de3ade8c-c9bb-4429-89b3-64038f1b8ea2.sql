
CREATE TABLE public.seo_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_meta TO anon;
GRANT SELECT ON public.seo_meta TO authenticated;
GRANT ALL ON public.seo_meta TO service_role;

ALTER TABLE public.seo_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read seo_meta" ON public.seo_meta FOR SELECT USING (true);
CREATE POLICY "Admins insert seo_meta" ON public.seo_meta FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update seo_meta" ON public.seo_meta FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete seo_meta" ON public.seo_meta FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.seo_meta (route, title, description, keywords) VALUES
('/', 'منصة NETWORKK | شبكة تواصل اجتماعي عراقية متكاملة', 'انضم إلى منصة NETWORKK، الشبكة الاجتماعية العراقية الأحدث لمشاركة المحتوى، الفيديوهات، والتواصل مع الأصدقاء.', 'منصة NETWORKK, شبكة نيتورك, منصة تواصل اجتماعي عراقية, تطبيق نيتورك, تسجيل دخول نيتورك, غيث محمد مصطفى, NETWORKK platform, Networkk online, Networkk app, Iraqi social network'),
('/welcome', 'منصة NETWORKK | شبكة تواصل اجتماعي عراقية متكاملة', 'انضم إلى منصة NETWORKK، الشبكة الاجتماعية العراقية الأحدث لمشاركة المحتوى، الفيديوهات، والتواصل مع الأصدقاء.', 'منصة NETWORKK, شبكة نيتورك, منصة تواصل اجتماعي عراقية, تطبيق نيتورك, تسجيل دخول نيتورك, NETWORKK platform, Networkk online, Networkk app, Iraqi social network'),
('/network-tv', 'نيتورك تي في | مسلسلات وأفلام ومقاطع شورتس قصيرة', 'شاهد أحدث المسلسلات، الأفلام، ومقاطع الفيديو القصيرة (Shorts) أونلاين في العراق بجودة عالية على نيتورك تي في.', 'نيتورك تي في, مسلسلات نيتورك, أفلام نيتورك سينما, مقاطع شورتس, فيديوهات قصيرة, مشاهدة أونلاين العراق, Network TV, Networkk cinema, Networkk shorts, watch online Iraq'),
('/shorts', 'نيتورك تي في | مسلسلات وأفلام ومقاطع شورتس قصيرة', 'شاهد أحدث المسلسلات، الأفلام، ومقاطع الفيديو القصيرة (Shorts) أونلاين في العراق بجودة عالية على نيتورك تي في.', 'نيتورك تي في, مسلسلات نيتورك, أفلام نيتورك سينما, مقاطع شورتس, فيديوهات قصيرة, مشاهدة أونلاين العراق, Network TV, Networkk cinema, Networkk shorts, watch online Iraq'),
('/tweets', 'استكشف نيتورك | آخر التغريدات والمنشورات وتريند العراق', 'تابع آخر الأخبار، التغريدات، والمنشورات الرائجة في العراق. استكشف محتوى صناع المحتوى على نيتورك.', 'تغريدات نيتورك, آخر الأخبار, استكشف نيتورك, منشورات شبكة نيتورك, تريند العراق اليوم, Networkk tweets, explore networkk, Iraqi trends, social posts'),
('/explore', 'استكشف نيتورك | آخر التغريدات والمنشورات وتريند العراق', 'تابع آخر الأخبار، التغريدات، والمنشورات الرائجة في العراق. استكشف محتوى صناع المحتوى على نيتورك.', 'تغريدات نيتورك, آخر الأخبار, استكشف نيتورك, منشورات شبكة نيتورك, تريند العراق اليوم, Networkk tweets, explore networkk, Iraqi trends, social posts'),
('/recharge', 'شحن الجواهر والرصيد | نظام الدفع الإلكتروني نيتورك', 'اشحن محفظتك وجواهر منصة نيتورك بأمان وسهولة عبر نظام الدفع الإلكتروني المدمج.', 'شحن جواهر نيتورك, نظام الدفع الإلكتروني نيتورك, إضافة رصيد, أسعار الجواهر, شحن محفظة نيتورك, Networkk recharge, add funds networkk, Gems system, buy networkk gems'),
('/add-funds', 'شحن الجواهر والرصيد | نظام الدفع الإلكتروني نيتورك', 'اشحن محفظتك وجواهر منصة نيتورك بأمان وسهولة عبر نظام الدفع الإلكتروني المدمج.', 'شحن جواهر نيتورك, نظام الدفع الإلكتروني نيتورك, إضافة رصيد, أسعار الجواهر, شحن محفظة نيتورك, Networkk recharge, add funds networkk, Gems system, buy networkk gems'),
('/business', 'نيتورك للأعمال | خدمات الشركات والتسويق الرقمي في العراق', 'طور أعمالك وأعلن على منصة NETWORKK. حلول تسويقية وإعلانية متكاملة للشركات وصناع المحتوى.', 'نيتورك للأعمال, خدمات الشركات, إعلانات منصة نيتورك, التسويق الرقمي في العراق, شركاء NETWORKK, Networkk business, business resources, Networkk ads, Networkk corp');
