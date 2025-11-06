-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  views_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view non-expired stories"
ON public.stories
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create their own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_user_id ON public.stories(user_id);

-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true);

-- Create storage policies for stories
CREATE POLICY "Anyone can view stories"
ON storage.objects
FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Users can upload their own stories"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own stories"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'stories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;