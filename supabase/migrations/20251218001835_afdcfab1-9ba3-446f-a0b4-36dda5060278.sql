-- Add social_links column to profiles table for multiple social media links
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;