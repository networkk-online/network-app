
-- Drop the existing policy and create a truly public one
DROP POLICY IF EXISTS "Anyone can view featured posts" ON public.featured_posts;

CREATE POLICY "Anyone can view featured posts"
ON public.featured_posts
FOR SELECT
TO anon, authenticated
USING (is_active = true);
