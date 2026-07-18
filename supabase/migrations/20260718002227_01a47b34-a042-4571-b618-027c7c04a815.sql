-- Drop the strict username length CHECK constraint so existing short usernames keep working
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_min_length;

-- Also drop any legacy trigger enforcing username length (if it exists)
DROP TRIGGER IF EXISTS enforce_username_length ON public.profiles;
DROP TRIGGER IF EXISTS profiles_username_length_check ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_username_length();

-- Relax handle_new_user() so signup never fails due to the 5-char rule (frontend enforces it for new signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;