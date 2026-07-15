DROP VIEW IF EXISTS public.profiles_public;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE VIEW public.profiles_public AS
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
  updated_at,
  location,
  school,
  profession,
  gender,
  is_live
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT ALL ON public.profiles_public TO service_role;