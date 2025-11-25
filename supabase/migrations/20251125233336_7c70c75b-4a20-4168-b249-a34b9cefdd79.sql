-- Create highlights table
CREATE TABLE public.highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create highlight_stories junction table
CREATE TABLE public.highlight_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES public.highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

-- Enable RLS
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for highlights
CREATE POLICY "Users can view all highlights"
ON public.highlights FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own highlights"
ON public.highlights FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
ON public.highlights FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
ON public.highlights FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for highlight_stories
CREATE POLICY "Users can view all highlight stories"
ON public.highlight_stories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can add stories to their highlights"
ON public.highlight_stories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.highlights
    WHERE highlights.id = highlight_stories.highlight_id
    AND highlights.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove stories from their highlights"
ON public.highlight_stories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.highlights
    WHERE highlights.id = highlight_stories.highlight_id
    AND highlights.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_highlights_updated_at
BEFORE UPDATE ON public.highlights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();