-- Drop and recreate the conversation_participants INSERT policy to allow adding other users
DROP POLICY IF EXISTS "insert_conversation_participants" ON public.conversation_participants;

-- New policy: Allow authenticated users to insert participants if they own the conversation or are adding themselves
CREATE POLICY "insert_conversation_participants" 
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves to any conversation
  user_id = auth.uid()
  OR
  -- User can add others to conversations they created (are already a participant)
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Also fix message insertion policy to use security definer function
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- Ensure messages UPDATE policy allows marking as read
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
)
WITH CHECK (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);