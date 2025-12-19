-- Fix infinite recursion in conversation_participants RLS policies
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to a conversation they are in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participant row" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create simple non-recursive policies for conversation_participants
CREATE POLICY "View own participation"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "View other participants in same conversation"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

CREATE POLICY "Add self as participant"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own participation"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());