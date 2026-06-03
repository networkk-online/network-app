
-- Payment gateways managed by admin
CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_amount NUMERIC NOT NULL DEFAULT 1,
  max_amount NUMERIC NOT NULL DEFAULT 10000,
  bonus_percent NUMERIC NOT NULL DEFAULT 0,
  instructions_ar TEXT DEFAULT '',
  instructions_en TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_gateways TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gateways" ON public.payment_gateways
  FOR SELECT USING (true);
CREATE POLICY "Admins manage gateways" ON public.payment_gateways
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.payment_gateways (key, name_en, name_ar, icon, min_amount, max_amount, bonus_percent, instructions_ar, instructions_en, sort_order) VALUES
  ('binance', 'Binance Pay', 'بايننس باي', '🟡', 5, 5000, 5, 'افتح تطبيق Binance واختر Pay ثم امسح رمز QR لإتمام الدفع.', 'Open Binance app, choose Pay, then scan the QR code to complete payment.', 1),
  ('visa', 'Visa / Mastercard', 'فيزا / ماستركارد', '💳', 1, 10000, 0, 'أدخل بيانات بطاقتك بأمان عبر بوابة الدفع المشفرة.', 'Enter your card details securely via the encrypted payment gateway.', 2),
  ('payeer', 'Payeer', 'باير', '🅿', 2, 5000, 2, 'حوّل المبلغ إلى محفظة Payeer الخاصة بالمنصة.', 'Transfer the amount to the platform Payeer wallet.', 3),
  ('zaincash', 'ZainCash', 'زين كاش', '📱', 1, 2000, 3, 'أرسل المبلغ عبر تطبيق زين كاش إلى الرقم المعروض.', 'Send the amount via ZainCash app to the displayed number.', 4);

-- About page singleton content
CREATE TABLE public.about_page_content (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title_ar TEXT NOT NULL DEFAULT 'من نحن',
  title_en TEXT NOT NULL DEFAULT 'About Us',
  intro_ar TEXT NOT NULL DEFAULT 'منصة Networkk الاجتماعية الرائدة.',
  intro_en TEXT NOT NULL DEFAULT 'Networkk — the leading social platform.',
  vision_ar TEXT NOT NULL DEFAULT 'رؤيتنا أن نكون المنصة الأولى في المنطقة.',
  vision_en TEXT NOT NULL DEFAULT 'To be the #1 platform in the region.',
  mission_ar TEXT NOT NULL DEFAULT 'تمكين المبدعين وبناء مجتمع رقمي آمن.',
  mission_en TEXT NOT NULL DEFAULT 'Empower creators and build a safe digital community.',
  story_ar TEXT NOT NULL DEFAULT 'بدأت قصتنا برؤية لإحداث فرق...',
  story_en TEXT NOT NULL DEFAULT 'Our story began with a vision to make a difference...',
  team_ar TEXT NOT NULL DEFAULT 'فريق شغوف من المهندسين والمصممين.',
  team_en TEXT NOT NULL DEFAULT 'A passionate team of engineers and designers.',
  stat_users INTEGER NOT NULL DEFAULT 0,
  stat_creators INTEGER NOT NULL DEFAULT 0,
  stat_countries INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.about_page_content TO anon, authenticated;
GRANT INSERT, UPDATE ON public.about_page_content TO authenticated;
GRANT ALL ON public.about_page_content TO service_role;

ALTER TABLE public.about_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view about" ON public.about_page_content
  FOR SELECT USING (true);
CREATE POLICY "Admins edit about" ON public.about_page_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_about_updated_at
  BEFORE UPDATE ON public.about_page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.about_page_content (id) VALUES (1) ON CONFLICT DO NOTHING;
