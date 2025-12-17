-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
DROP FUNCTION IF EXISTS public.handle_follow_notification();

-- Create corrected notification function for follows
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the user being followed
  INSERT INTO public.notifications (user_id, actor_id, type, content)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'بدأ بمتابعتك'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger with correct field names
CREATE TRIGGER on_follow_notification
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_follow_notification();