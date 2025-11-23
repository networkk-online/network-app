-- Fix infinite recursion in conversation_participants RLS policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view participants of their conversations" 
ON conversation_participants 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);