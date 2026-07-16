-- Remove the broad anon SELECT policy on public.profiles.
-- Anonymous visitors must go through public.profiles_public (filtered view) instead,
-- which hides phone_number, phone_country_code, business_email, birth_date, etc.
DROP POLICY IF EXISTS "Anon can view public profile rows" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;