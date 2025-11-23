-- Drop the problematic policy and create a simpler one
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create a simple policy without recursion
CREATE POLICY "Users can view conversation participants" 
ON conversation_participants 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid()
    LIMIT 1
  )
);