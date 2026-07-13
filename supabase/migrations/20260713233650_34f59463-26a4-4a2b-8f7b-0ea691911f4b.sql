-- 1. Drop the over-permissive anon SELECT policy on profiles
DROP POLICY IF EXISTS "Anon can view profiles safe cols" ON public.profiles;

-- 2. Create a safe public view exposing only non-PII columns
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
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
  created_at
FROM public.profiles;

-- 3. Grant read access on the public view
GRANT SELECT ON public.profiles_public TO anon, authenticated;