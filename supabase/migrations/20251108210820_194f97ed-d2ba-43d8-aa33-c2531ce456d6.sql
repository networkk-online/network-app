-- Create reel_comments table
CREATE TABLE public.reel_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Enable RLS on reel_comments
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for reel_comments
CREATE POLICY "Anyone can view reel comments" 
ON public.reel_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can comment on reels" 
ON public.reel_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reel comments" 
ON public.reel_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comments" 
ON public.reel_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_views
CREATE POLICY "Anyone can view story views" 
ON public.story_views 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can record story views" 
ON public.story_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to update reel comments count
CREATE OR REPLACE FUNCTION public.update_reel_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels
    SET comments_count = comments_count + 1
    WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reels
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.reel_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for reel comments count
CREATE TRIGGER on_reel_comment_change
AFTER INSERT OR DELETE ON public.reel_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_reel_comments_count();

-- Trigger for reel comments updated_at
CREATE TRIGGER update_reel_comments_updated_at
BEFORE UPDATE ON public.reel_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update story views count
CREATE OR REPLACE FUNCTION public.update_story_views_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET views_count = views_count + 1
    WHERE id = NEW.story_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for story views count
CREATE TRIGGER on_story_view_insert
AFTER INSERT ON public.story_views
FOR EACH ROW
EXECUTE FUNCTION public.update_story_views_count();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.reel_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;