CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_requested_username text;
  v_username text;
  v_full_name text;
BEGIN
  v_requested_username := lower(regexp_replace(trim(COALESCE(new.raw_user_meta_data->>'username', '')), '^@+', ''));

  v_username := COALESCE(
    NULLIF(v_requested_username, ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
  );

  -- Never let profile creation fail the auth signup because of an already-taken username.
  -- If the requested username exists on another profile, assign a deterministic fallback.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username AND id IS DISTINCT FROM new.id) THEN
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  END IF;

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
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, username, full_name, phone_number, phone_country_code)
    VALUES (
      new.id,
      'user_' || substr(replace(new.id::text, '-', ''), 1, 10),
      COALESCE(NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 10)),
      new.raw_user_meta_data->>'phone_number',
      new.raw_user_meta_data->>'phone_country_code'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;