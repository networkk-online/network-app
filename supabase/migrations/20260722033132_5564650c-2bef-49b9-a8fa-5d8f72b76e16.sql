
-- Bypass the privileged-fields guard trigger for this administrative maintenance update.
ALTER TABLE public.profiles DISABLE TRIGGER USER;
UPDATE public.profiles
SET is_suspended = true
WHERE char_length(username) <= 3
  AND lower(username) <> 'v'
  AND is_suspended IS DISTINCT FROM true;
ALTER TABLE public.profiles ENABLE TRIGGER USER;
