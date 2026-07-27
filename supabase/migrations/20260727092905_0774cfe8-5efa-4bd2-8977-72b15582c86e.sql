-- Drop the overly permissive self-join policies
DROP POLICY IF EXISTS "Authenticated users can add themselves as participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;

-- Only allow inserting participants when:
--   (a) the row is being added by an existing participant of that conversation, OR
--   (b) the conversation was just created and has no participants yet (creator bootstrap)
CREATE POLICY "Participants can add others to their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
  OR NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
  )
);