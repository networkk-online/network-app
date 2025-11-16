-- Create close_friends table
CREATE TABLE IF NOT EXISTS public.close_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own close friends list"
  ON public.close_friends
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their close friends list"
  ON public.close_friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their close friends list"
  ON public.close_friends
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add close_friends_only column to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS close_friends_only BOOLEAN DEFAULT false;

-- Add close_friends_only column to stories table
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS close_friends_only BOOLEAN DEFAULT false;

-- Add close_friends_only column to reels table
ALTER TABLE public.reels 
ADD COLUMN IF NOT EXISTS close_friends_only BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_close_friends_user_id ON public.close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_friend_id ON public.close_friends(friend_id);

-- Update posts RLS policy to handle close friends
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Users can view public posts or close friends posts"
  ON public.posts
  FOR SELECT
  USING (
    close_friends_only = false 
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.close_friends
      WHERE user_id = posts.user_id
      AND friend_id = auth.uid()
    )
  );

-- Update stories RLS policy to handle close friends  
DROP POLICY IF EXISTS "Anyone can view non-expired stories" ON public.stories;
CREATE POLICY "Users can view public or close friends stories"
  ON public.stories
  FOR SELECT
  USING (
    expires_at > now() 
    AND (
      close_friends_only = false 
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.close_friends
        WHERE user_id = stories.user_id
        AND friend_id = auth.uid()
      )
    )
  );

-- Update reels RLS policy to handle close friends
DROP POLICY IF EXISTS "Anyone can view reels" ON public.reels;
CREATE POLICY "Users can view public or close friends reels"
  ON public.reels
  FOR SELECT
  USING (
    close_friends_only = false 
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.close_friends
      WHERE user_id = reels.user_id
      AND friend_id = auth.uid()
    )
  );