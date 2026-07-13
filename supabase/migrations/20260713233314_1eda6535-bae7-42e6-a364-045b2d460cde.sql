-- Fix profiles UPDATE policy: add explicit WITH CHECK so new row must still match auth.uid() = id
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add missing settings columns for MessagesSettings persistence
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS allow_story_replies boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_message_requests boolean DEFAULT true;