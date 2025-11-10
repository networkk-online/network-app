-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL CHECK (placement IN ('feed', 'stories', 'sidebar', 'reels')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ad_interactions table for tracking
CREATE TABLE public.ad_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.advertisements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertisements
CREATE POLICY "Anyone can view active ads"
ON public.advertisements
FOR SELECT
USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admins can view all ads"
ON public.advertisements
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ads"
ON public.advertisements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ads"
ON public.advertisements
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ads"
ON public.advertisements
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ad_interactions
CREATE POLICY "Users can insert their own interactions"
ON public.ad_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all interactions"
ON public.ad_interactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updating ad stats
CREATE OR REPLACE FUNCTION public.update_ad_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.interaction_type = 'view' THEN
    UPDATE public.advertisements
    SET views_count = views_count + 1
    WHERE id = NEW.ad_id;
  ELSIF NEW.interaction_type = 'click' THEN
    UPDATE public.advertisements
    SET clicks_count = clicks_count + 1
    WHERE id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ad_interaction
AFTER INSERT ON public.ad_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_ad_stats();

-- Trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();