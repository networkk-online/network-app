-- Add parent_id and replies_count to comments
ALTER TABLE public.comments 
ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN replies_count INTEGER DEFAULT 0;

-- Add parent_id and replies_count to reel_comments
ALTER TABLE public.reel_comments 
ADD COLUMN parent_id UUID REFERENCES public.reel_comments(id) ON DELETE CASCADE,
ADD COLUMN replies_count INTEGER DEFAULT 0;

-- Create function to update replies count for comments
CREATE OR REPLACE FUNCTION public.update_comment_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for comments replies count
CREATE TRIGGER on_comment_reply_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_replies_count();

-- Create function to update replies count for reel_comments
CREATE OR REPLACE FUNCTION public.update_reel_comment_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.reel_comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.reel_comments
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for reel_comments replies count
CREATE TRIGGER on_reel_comment_reply_change
AFTER INSERT OR DELETE ON public.reel_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_reel_comment_replies_count();

-- Create function to notify comment replies
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_comment_owner_id UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment owner
    SELECT user_id INTO parent_comment_owner_id
    FROM public.comments
    WHERE id = NEW.parent_id;
    
    -- Don't notify if user replies to their own comment
    IF parent_comment_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, content)
      VALUES (parent_comment_owner_id, NEW.user_id, 'reply', NEW.post_id, NEW.id, NEW.content);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment reply notifications
CREATE TRIGGER on_comment_reply_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_reply();

-- Create function to notify reel comment replies
CREATE OR REPLACE FUNCTION public.notify_reel_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_comment_owner_id UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment owner
    SELECT user_id INTO parent_comment_owner_id
    FROM public.reel_comments
    WHERE id = NEW.parent_id;
    
    -- Don't notify if user replies to their own comment
    IF parent_comment_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, comment_id, content)
      VALUES (parent_comment_owner_id, NEW.user_id, 'reply', NEW.id, NEW.content);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for reel comment reply notifications
CREATE TRIGGER on_reel_comment_reply_created
AFTER INSERT ON public.reel_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_reel_comment_reply();