-- Add new fields to profiles table for local fame ranking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS school TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS fame_score INTEGER DEFAULT 0;

-- Create index for faster fame ranking queries
CREATE INDEX IF NOT EXISTS idx_profiles_fame_score ON public.profiles(fame_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school);
CREATE INDEX IF NOT EXISTS idx_profiles_profession ON public.profiles(profession);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);

-- Create function to calculate fame score
CREATE OR REPLACE FUNCTION public.calculate_fame_score(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_score INTEGER;
  followers INTEGER;
  posts_count INTEGER;
  total_likes INTEGER;
BEGIN
  -- Get follower count
  SELECT COALESCE(followers_count, 0) INTO followers
  FROM public.profiles
  WHERE id = user_id;
  
  -- Get posts count
  SELECT COUNT(*) INTO posts_count
  FROM public.posts
  WHERE posts.user_id = calculate_fame_score.user_id;
  
  -- Get total likes
  SELECT COALESCE(SUM(likes_count), 0) INTO total_likes
  FROM public.posts
  WHERE posts.user_id = calculate_fame_score.user_id;
  
  -- Calculate fame score: followers * 10 + posts * 5 + likes * 2
  total_score := (followers * 10) + (posts_count * 5) + (total_likes * 2);
  
  RETURN total_score;
END;
$$;

-- Create function to update all fame scores
CREATE OR REPLACE FUNCTION public.update_all_fame_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET fame_score = public.calculate_fame_score(id);
END;
$$;

-- Update fame score when posts or likes change
CREATE OR REPLACE FUNCTION public.update_user_fame_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET fame_score = public.calculate_fame_score(NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update fame score on new post
CREATE OR REPLACE TRIGGER on_post_insert_update_fame
AFTER INSERT OR UPDATE OF likes_count ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_user_fame_score();

-- Trigger to update fame score on follow
CREATE OR REPLACE TRIGGER on_follow_update_fame
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_user_fame_score();