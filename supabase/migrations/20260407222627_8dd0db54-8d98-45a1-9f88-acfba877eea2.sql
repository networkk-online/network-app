
-- Table for pinned explore posts
CREATE TABLE public.pinned_explore_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
  pinned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(position),
  UNIQUE(post_id)
);

ALTER TABLE public.pinned_explore_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read pinned posts (needed for explore page)
CREATE POLICY "Anyone can view pinned posts"
  ON public.pinned_explore_posts FOR SELECT
  USING (true);

-- Only authenticated users can manage (admin check in app code)
CREATE POLICY "Authenticated users can manage pinned posts"
  ON public.pinned_explore_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
