-- Add show_in_feed column to reels table
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS show_in_feed BOOLEAN DEFAULT true;