-- Ensure required tables exist in public schema (no-op if already exist)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  pinned_by uuid[] NULL,
  archived_by uuid[] NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean DEFAULT false,
  is_temporary boolean DEFAULT false,
  view_once boolean DEFAULT false,
  view_twice boolean DEFAULT false,
  view_count integer DEFAULT 0,
  deleted_for_everyone boolean DEFAULT false,
  deleted_for_sender boolean DEFAULT false,
  deleted_for_receiver boolean DEFAULT false,
  content text NULL,
  media_url text NULL,
  media_type text NULL
);

-- Keep RLS enabled (do NOT disable). Ensure it's enabled.
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies: authenticated participants can see their conversations; authenticated users can create a conversation
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  id IN (SELECT public.get_user_conversation_ids(auth.uid()))
)
WITH CHECK (
  id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- Messages policies (participant-based access)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

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

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
