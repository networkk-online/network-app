-- Drop the existing update policy first
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- Recreate UPDATE policy: Users can update messages in their conversations (for read status, etc.)
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

-- Drop and recreate DELETE policy
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id
);