-- Restore full column read access for authenticated users so profile queries using select('*') work.
-- Anonymous (public) access remains restricted to non-sensitive columns only.
GRANT SELECT ON public.profiles TO authenticated;
-- Ensure anon keeps ONLY the safe columns (re-assert)
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, username, full_name, avatar_url, cover_url, bio, location, website,
  is_verified, verification_type, is_banned, is_suspended,
  is_business_account, business_category, business_description, business_email,
  business_website, business_hours, profession, school, gender, social_links,
  fame_score, followers_count, following_count,
  affiliated_company_id, created_at, updated_at
) ON public.profiles TO anon;