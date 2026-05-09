
-- 1. follow_events table for analytics (gained/lost over time)
CREATE TABLE IF NOT EXISTS public.follow_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('follow','unfollow')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_events_following_created
  ON public.follow_events (following_id, created_at DESC);

ALTER TABLE public.follow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read follow events" ON public.follow_events;
CREATE POLICY "Authenticated can read follow events"
  ON public.follow_events FOR SELECT
  TO authenticated
  USING (true);

-- 2. Trigger function: maintain counts + log event
CREATE OR REPLACE FUNCTION public.handle_follows_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
      SET followers_count = COALESCE(followers_count, 0) + 1
      WHERE id = NEW.following_id;
    UPDATE public.profiles
      SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
    INSERT INTO public.follow_events (follower_id, following_id, event_type)
      VALUES (NEW.follower_id, NEW.following_id, 'follow');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
      WHERE id = OLD.following_id;
    UPDATE public.profiles
      SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
      WHERE id = OLD.follower_id;
    INSERT INTO public.follow_events (follower_id, following_id, event_type)
      VALUES (OLD.follower_id, OLD.following_id, 'unfollow');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follows_insert ON public.follows;
DROP TRIGGER IF EXISTS trg_follows_delete ON public.follows;

CREATE TRIGGER trg_follows_insert
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follows_change();

CREATE TRIGGER trg_follows_delete
  AFTER DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follows_change();

-- 3. Backfill consistent counts from current follows table
UPDATE public.profiles p SET
  followers_count = COALESCE((SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id), 0),
  following_count = COALESCE((SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id), 0);
