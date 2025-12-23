-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view public posts or close friends posts" ON public.posts;

-- Create a new policy that allows anyone to view public posts
CREATE POLICY "Anyone can view public posts" 
ON public.posts 
FOR SELECT 
USING (
  close_friends_only = false 
  OR user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM close_friends 
    WHERE close_friends.user_id = posts.user_id 
    AND close_friends.friend_id = auth.uid()
  )
);

-- Also update profiles to be publicly viewable
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);