-- Clean up conflicting/overly-permissive DM policies (keep only the authenticated-safe set)

-- conversation_participants: remove old/buggy policies
DROP POLICY IF EXISTS "Allow adding participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.conversation_participants;

-- messages: remove old public policies
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- (Optional) add a safe delete policy for authenticated users only
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
