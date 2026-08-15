-- Public read access for profiles (safe columns only, enforced by column grants)
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles"
ON public.profiles FOR SELECT TO anon USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, username, full_name, avatar_url, cover_url, bio, is_verified,
  verification_type, followers_count, following_count, is_business_account,
  affiliated_company_id, account_type, specialty, business_category,
  business_description, business_website, website, social_links, fame_score,
  created_at, updated_at, school, profession, is_live, follower_count_override)
ON public.profiles TO anon;

-- Public read access for donations shown in the public donations view
DROP POLICY IF EXISTS "Public can view donations" ON public.broadcast_donations;
CREATE POLICY "Public can view donations"
ON public.broadcast_donations FOR SELECT TO anon USING (true);

REVOKE SELECT ON public.broadcast_donations FROM anon;
GRANT SELECT (id, broadcast_id, donor_user_id, creator_user_id, amount, message, created_at)
ON public.broadcast_donations TO anon;

DROP POLICY IF EXISTS "Authenticated can view donations" ON public.broadcast_donations;
CREATE POLICY "Authenticated can view donations"
ON public.broadcast_donations FOR SELECT TO authenticated USING (true);

-- Switch views to caller privileges
ALTER VIEW public.profiles_public SET (security_invoker = on);
ALTER VIEW public.broadcast_donations_public SET (security_invoker = on);

GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.broadcast_donations_public TO anon, authenticated;

NOTIFY pgrst, 'reload schema';