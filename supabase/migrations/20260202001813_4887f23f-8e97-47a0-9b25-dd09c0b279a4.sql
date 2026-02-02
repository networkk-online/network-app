-- Add foreign key relationship from follows to profiles for following (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'follows_following_id_fkey'
    ) THEN
        ALTER TABLE public.follows 
        ADD CONSTRAINT follows_following_id_fkey 
        FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END$$;

-- Fix RLS policies for conversations table
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

-- Allow any authenticated user to create a conversation
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view conversations they participate in
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));

-- Allow users to update conversations they participate in
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()));