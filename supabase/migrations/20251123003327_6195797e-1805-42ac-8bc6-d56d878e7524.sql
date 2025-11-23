-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

-- Create simple policies without recursion
-- Allow users to see their own participation records
CREATE POLICY "Users can view their own participation" 
ON conversation_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to add participants
CREATE POLICY "Allow adding participants" 
ON conversation_participants 
FOR INSERT 
WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Users can update own participation" 
ON conversation_participants 
FOR UPDATE 
USING (user_id = auth.uid());