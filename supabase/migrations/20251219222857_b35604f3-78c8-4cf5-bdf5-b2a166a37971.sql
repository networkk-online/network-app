-- Drop ALL existing policies on conversation_participants to fix recursion
DROP POLICY IF EXISTS "View own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "View other participants in same conversation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Add self as participant" ON public.conversation_participants;
DROP POLICY IF EXISTS "Update own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to a conversation they are in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participant row" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create simple, non-recursive policy using a security definer function
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = p_user_id;
$$;

-- Simple SELECT policy: user can see all participants in conversations they're part of
CREATE POLICY "select_conversation_participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- Simple INSERT policy: user can add themselves as participant
CREATE POLICY "insert_conversation_participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Simple UPDATE policy: user can update their own row
CREATE POLICY "update_conversation_participants"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Simple DELETE policy: user can remove themselves
CREATE POLICY "delete_conversation_participants"
ON public.conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());