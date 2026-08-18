ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS shared_post_id uuid,
  ADD COLUMN IF NOT EXISTS shared_post_transform jsonb;

CREATE INDEX IF NOT EXISTS idx_stories_shared_post_id ON public.stories(shared_post_id) WHERE shared_post_id IS NOT NULL;