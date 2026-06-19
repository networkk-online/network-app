-- Restrict PII columns on public.profiles. RLS still allows row visibility for public profile fields,
-- but column-level privileges prevent anon/authenticated from reading phone_number, phone_country_code,
-- or birth_date directly. Owners must use the get_my_phone() SECURITY DEFINER RPC for their own phone.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, username, full_name, avatar_url, cover_url, bio, location, website,
  is_verified, verification_type, is_banned, is_suspended,
  is_business_account, business_category, business_description, business_email,
  business_website, business_hours, profession, school, gender, social_links,
  fame_score, followers_count, following_count,
  affiliated_company_id, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Service role keeps full access for server/edge function logic
GRANT ALL ON public.profiles TO service_role;