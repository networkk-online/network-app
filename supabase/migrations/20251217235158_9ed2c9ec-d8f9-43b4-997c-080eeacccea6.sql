-- Fix follows fame-score trigger without touching the existing update_user_fame_score() used by posts

DROP TRIGGER IF EXISTS on_follow_update_fame ON public.follows;

CREATE OR REPLACE FUNCTION public.update_user_fame_score_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET fame_score = public.calculate_fame_score(NEW.follower_id)
    WHERE id = NEW.follower_id;

    UPDATE public.profiles
    SET fame_score = public.calculate_fame_score(NEW.following_id)
    WHERE id = NEW.following_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET fame_score = public.calculate_fame_score(OLD.follower_id)
    WHERE id = OLD.follower_id;

    UPDATE public.profiles
    SET fame_score = public.calculate_fame_score(OLD.following_id)
    WHERE id = OLD.following_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_follow_update_fame
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_user_fame_score_on_follow();