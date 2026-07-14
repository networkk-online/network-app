CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  username,
  full_name,
  avatar_url,
  cover_url,
  bio,
  is_verified,
  verification_type,
  followers_count,
  following_count,
  is_business_account,
  affiliated_company_id,
  account_type,
  specialty,
  business_category,
  business_description,
  business_website,
  website,
  social_links,
  fame_score,
  created_at,
  is_live
FROM public.profiles;