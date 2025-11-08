-- Create reels table
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reels
CREATE POLICY "Anyone can view reels"
  ON public.reels
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reels"
  ON public.reels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
  ON public.reels
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
  ON public.reels
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any reel"
  ON public.reels
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create reel_likes table
CREATE TABLE public.reel_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reel_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reel_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT reel_likes_reel_id_fkey FOREIGN KEY (reel_id) REFERENCES public.reels(id) ON DELETE CASCADE,
  UNIQUE(user_id, reel_id)
);

-- Enable Row Level Security
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reel_likes
CREATE POLICY "Anyone can view reel likes"
  ON public.reel_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like reels"
  ON public.reel_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.reel_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update reel likes count
CREATE OR REPLACE FUNCTION public.update_reel_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels
    SET likes_count = likes_count + 1
    WHERE id = NEW.reel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reels
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.reel_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for reel likes count
CREATE TRIGGER on_reel_like_change
  AFTER INSERT OR DELETE ON public.reel_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reel_likes_count();

-- Create trigger for updated_at
CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON public.reels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for reels
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels', 'reels', true);

-- Storage policies for reels bucket
CREATE POLICY "Anyone can view reels"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'reels');

CREATE POLICY "Authenticated users can upload reels"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'reels' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own reels"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'reels' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own reels"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'reels' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable realtime for reels
ALTER PUBLICATION supabase_realtime ADD TABLE public.reels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reel_likes;