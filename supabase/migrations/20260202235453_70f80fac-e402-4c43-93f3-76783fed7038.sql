-- Fix the conversation_participants INSERT policy to properly handle adding both participants
-- The issue is that when creating a conversation, user adds themselves first, then adds the other user
-- But the policy doesn't allow adding the other user because the first insert hasn't committed yet

-- Drop existing policy
DROP POLICY IF EXISTS "insert_conversation_participants" ON public.conversation_participants;

-- Create a more permissive but still secure policy
-- Users can add participants to conversations they're already part of
-- This is checked AFTER the insert, so we need a different approach

-- Create a security definer function to check conversation ownership
CREATE OR REPLACE FUNCTION public.can_add_participant_to_conversation(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- User can add to a conversation if they created it (are the first participant)
  -- or if it's a new conversation with no participants yet
  SELECT (
    -- User is the one being added (can add self)
    p_user_id = auth.uid()
    OR
    -- User is already a participant in this conversation
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
    )
    OR
    -- Conversation has no participants yet (new conversation)
    NOT EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = p_conversation_id
    )
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_add_participant_to_conversation(conversation_id, user_id)
);