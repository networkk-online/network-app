
-- Add reply_to_message_id column to messages table
ALTER TABLE public.messages ADD COLUMN reply_to_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Allow authenticated users to INSERT into conversations
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to INSERT into conversation_participants (for themselves)
CREATE POLICY "Authenticated users can add themselves as participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM conversation_participants cp 
  WHERE cp.conversation_id = conversation_participants.conversation_id 
  AND cp.user_id = auth.uid()
));
