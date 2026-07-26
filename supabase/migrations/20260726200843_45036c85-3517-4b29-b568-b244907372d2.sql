-- 1) Refresh profiles_public: drop gender/location (now strictly private)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker=true) AS
SELECT
  id, username, full_name, avatar_url, cover_url, bio,
  is_verified, verification_type,
  followers_count, following_count,
  is_business_account, affiliated_company_id,
  account_type, specialty,
  business_category, business_description, business_website,
  website, social_links,
  fame_score, created_at, updated_at,
  school, profession, is_live
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2) Revoke column-level SELECT of the 5 sensitive fields from anon & authenticated.
--    Column privileges are enforced by PostgREST before RLS, so any client attempt
--    to read these columns is rejected with a permission error.
REVOKE SELECT (phone_number, phone_country_code, birth_date, business_email, gender, location)
  ON public.profiles FROM anon, authenticated;

-- service_role keeps access for admin edge functions
GRANT SELECT (phone_number, phone_country_code, birth_date, business_email, gender, location)
  ON public.profiles TO service_role;

-- 3) Owner-only accessor for the full row (including PII).
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

-- 4) Admin accessor for a specific user's full row (used by admin dashboards)
CREATE OR REPLACE FUNCTION public.admin_get_profile_pii(_user_id uuid)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.profiles WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_profile_pii(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_profile_pii(uuid) TO authenticated;