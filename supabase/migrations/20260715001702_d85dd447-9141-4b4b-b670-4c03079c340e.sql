
-- Fix profiles visibility: previously only the owner + admins could read profiles,
-- which broke the feed (posts/reels/stories join profiles for username & avatar).
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

GRANT SELECT ON public.profiles TO anon;

-- Harden the new-user trigger to always populate a display name / username fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_username text;
  v_full_name text;
BEGIN
  v_username := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'username'), ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
  );
  v_full_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    v_username
  );

  INSERT INTO public.profiles (id, username, full_name, phone_number, phone_country_code)
  VALUES (
    new.id,
    v_username,
    v_full_name,
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'phone_country_code'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
