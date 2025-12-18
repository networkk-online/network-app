-- Drop and recreate the participants policy to allow adding other users
DROP POLICY IF EXISTS "Allow adding participants" ON public.conversation_participants;

CREATE POLICY "Allow adding participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves OR add others to conversations they created
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversation_id 
    AND cp.user_id = auth.uid()
  )
);