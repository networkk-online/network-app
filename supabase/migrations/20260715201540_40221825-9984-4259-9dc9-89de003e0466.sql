ALTER VIEW public.profiles_public SET (security_invoker = true);

DROP POLICY IF EXISTS "Anon can view public profile rows" ON public.profiles;
CREATE POLICY "Anon can view public profile rows"
ON public.profiles
FOR SELECT
TO anon
USING (true);

GRANT SELECT (
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
) ON public.profiles TO anon;

REVOKE SELECT (phone_number, phone_country_code, business_email, birth_date)
ON public.profiles FROM anon;