UPDATE public.profiles
SET username = username || '_' || substr(replace(id::text,'-',''),1,6)
WHERE username IS NOT NULL AND char_length(username) < 5;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_min_length CHECK (username IS NULL OR char_length(username) >= 5);

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
  IF char_length(v_username) < 5 THEN
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
END;
$function$;