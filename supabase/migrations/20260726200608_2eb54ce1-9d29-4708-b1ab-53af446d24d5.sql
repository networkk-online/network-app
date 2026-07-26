-- 1) Harden handle_new_user: reject 1-2 char requested usernames by falling back
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

  -- Reserve 1-2 character handles for legacy accounts only
  IF length(v_requested_username) < 3 THEN
    v_requested_username := '';
  END IF;

  v_username := COALESCE(
    NULLIF(v_requested_username, ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
  );

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

-- 2) Guard trigger: block INSERT/UPDATE that sets username to 1-2 chars
--    Preserves existing 1-2 char usernames (they can stay, just cannot be created or renamed to)
CREATE OR REPLACE FUNCTION public.guard_short_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admins are exempt (needed for manual reservations of premium handles)
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.username IS NOT NULL AND length(NEW.username) < 3 THEN
      RAISE EXCEPTION 'short_username_reserved'
        USING HINT = 'Usernames shorter than 3 characters are reserved for legacy accounts.';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: only block when the username is actually changing to a short value
  IF NEW.username IS DISTINCT FROM OLD.username
     AND NEW.username IS NOT NULL
     AND length(NEW.username) < 3 THEN
    RAISE EXCEPTION 'short_username_reserved'
      USING HINT = 'Usernames shorter than 3 characters are reserved for legacy accounts.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_profiles_guard_short_username ON public.profiles;
CREATE TRIGGER trg_profiles_guard_short_username
BEFORE INSERT OR UPDATE OF username ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_short_username();