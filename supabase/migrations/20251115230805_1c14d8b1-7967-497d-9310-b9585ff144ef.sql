-- Add cover image support to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url TEXT;

COMMENT ON COLUMN public.profiles.cover_url IS 'URL for user profile cover image';