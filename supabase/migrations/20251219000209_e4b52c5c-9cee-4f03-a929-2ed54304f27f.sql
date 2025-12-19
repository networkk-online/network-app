-- Fix Direct Messages RLS so users can create conversations and send messages safely (retry without realtime publication change)

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update conversations they participate in"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

-- Conversation participants policies
DROP POLICY IF EXISTS "Users can view their conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to a conversation they are in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participant row" ON public.conversation_participants;

CREATE POLICY "Users can view their conversation participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants me
    WHERE me.conversation_id = conversation_participants.conversation_id
      AND me.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to a conversation they are in"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (conversation_participants.user_id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.conversation_participants me
    WHERE me.conversation_id = conversation_participants.conversation_id
      AND me.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their participant row"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (conversation_participants.user_id = auth.uid())
WITH CHECK (conversation_participants.user_id = auth.uid());

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  messages.sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (messages.sender_id = auth.uid())
WITH CHECK (messages.sender_id = auth.uid());
