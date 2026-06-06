
-- =========================
-- site_pages
-- =========================
CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  meta_description text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_pages public read" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "site_pages admin insert" ON public.site_pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site_pages admin update" ON public.site_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "site_pages admin delete" ON public.site_pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_pages_set_updated_at BEFORE UPDATE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_pages (slug, title, body, meta_description) VALUES
  ('about', 'About NETWORKK', 'NETWORKK is a next-generation social platform owned by Network FZ-LLC.', 'About NETWORKK and Network FZ-LLC.'),
  ('newsroom', 'Newsroom', 'Latest news and press releases from NETWORKK.', 'NETWORKK newsroom and press.'),
  ('investors', 'Investors', 'Investor relations for Network FZ-LLC.', 'Investor relations.'),
  ('platform-status', 'Platform Status', 'All systems operational.', 'NETWORKK platform status.'),
  ('accessibility', 'Accessibility', 'Our commitment to accessibility for all users.', 'Accessibility statement.'),
  ('download', 'Download App', 'Download the NETWORKK mobile app.', 'Download NETWORKK.'),
  ('help', 'Help Center', 'Browse help articles or contact support.', 'NETWORKK help center.'),
  ('using-networkk', 'Using NETWORKK', 'Learn how to get the most out of NETWORKK.', 'Using NETWORKK guides.'),
  ('manage-account', 'Manage Account', 'Manage your account settings and privacy.', 'Manage your NETWORKK account.'),
  ('terms', 'Terms & Policies', 'Terms of Service and Privacy Policy.', 'NETWORKK terms and policies.'),
  ('contact', 'Contact Us', 'Get in touch with the NETWORKK team.', 'Contact NETWORKK.'),
  ('developers', 'Developer Home', 'Build with the NETWORKK platform.', 'NETWORKK for developers.'),
  ('docs', 'Documentation', 'Technical documentation for developers.', 'NETWORKK developer docs.'),
  ('engineering-blog', 'Engineering Blog', 'Stories from the NETWORKK engineering team.', 'NETWORKK engineering blog.'),
  ('advertising', 'Advertising', 'Advertise on NETWORKK.', 'Advertising on NETWORKK.'),
  ('business', 'NETWORKK for Business', 'Grow your business on NETWORKK.', 'NETWORKK for business.'),
  ('resources', 'Resources & Guides', 'Resources and guides for businesses.', 'Business resources.');

-- =========================
-- careers_jobs
-- =========================
CREATE TABLE public.careers_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text DEFAULT '',
  location text DEFAULT 'Remote',
  employment_type text DEFAULT 'Full-time',
  description text NOT NULL DEFAULT '',
  requirements text DEFAULT '',
  is_open boolean NOT NULL DEFAULT true,
  posted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.careers_jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.careers_jobs TO authenticated;
GRANT ALL ON public.careers_jobs TO service_role;

ALTER TABLE public.careers_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "careers public read" ON public.careers_jobs FOR SELECT USING (true);
CREATE POLICY "careers admin insert" ON public.careers_jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "careers admin update" ON public.careers_jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "careers admin delete" ON public.careers_jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER careers_jobs_set_updated_at BEFORE UPDATE ON public.careers_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- support_settings (singleton)
-- =========================
CREATE TABLE public.support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_phone text DEFAULT '07737318706',
  whatsapp_url text DEFAULT 'https://wa.me/9647737318706',
  hero_title text DEFAULT 'Support & Help Center',
  hero_subtitle text DEFAULT 'We are here to help with Gems & Electronic Payments.',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.support_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_settings TO authenticated;
GRANT ALL ON public.support_settings TO service_role;

ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support public read" ON public.support_settings FOR SELECT USING (true);
CREATE POLICY "support admin insert" ON public.support_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "support admin update" ON public.support_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "support admin delete" ON public.support_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER support_settings_set_updated_at BEFORE UPDATE ON public.support_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.support_settings (sections) VALUES (
  '[
    {"title":"Gems & Electronic Payment System","body":"Learn how to top up gems and use electronic payments."},
    {"title":"Account & Security","body":"Manage your account, password, and two-factor authentication."}
  ]'::jsonb
);
