
-- Create tweets table
CREATE TABLE public.tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  likes_count INTEGER NOT NULL DEFAULT 0,
  retweets_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
  quote_tweet_id UUID REFERENCES public.tweets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tweet_likes table
CREATE TABLE public.tweet_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tweet_id, user_id)
);

-- Create tweet_retweets table
CREATE TABLE public.tweet_retweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id UUID NOT NULL REFERENCES public.tweets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tweet_id, user_id)
);

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_retweets ENABLE ROW LEVEL SECURITY;

-- Tweets RLS
CREATE POLICY "Anyone can view public tweets" ON public.tweets FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create tweets" ON public.tweets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tweets" ON public.tweets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tweets" ON public.tweets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tweet likes RLS
CREATE POLICY "Anyone can view tweet likes" ON public.tweet_likes FOR SELECT USING (true);
CREATE POLICY "Users can like tweets" ON public.tweet_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike tweets" ON public.tweet_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tweet retweets RLS
CREATE POLICY "Anyone can view retweets" ON public.tweet_retweets FOR SELECT USING (true);
CREATE POLICY "Users can retweet" ON public.tweet_retweets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unretweet" ON public.tweet_retweets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers for counts
CREATE OR REPLACE FUNCTION public.update_tweet_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tweets SET likes_count = likes_count + 1 WHERE id = NEW.tweet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tweets SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.tweet_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_tweet_like_change
  AFTER INSERT OR DELETE ON public.tweet_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_tweet_likes_count();

CREATE OR REPLACE FUNCTION public.update_tweet_retweets_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tweets SET retweets_count = retweets_count + 1 WHERE id = NEW.tweet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tweets SET retweets_count = GREATEST(0, retweets_count - 1) WHERE id = OLD.tweet_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_tweet_retweet_change
  AFTER INSERT OR DELETE ON public.tweet_retweets
  FOR EACH ROW EXECUTE FUNCTION public.update_tweet_retweets_count();

CREATE OR REPLACE FUNCTION public.update_tweet_replies_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.tweets SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.tweets SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_tweet_reply_change
  AFTER INSERT OR DELETE ON public.tweets
  FOR EACH ROW EXECUTE FUNCTION public.update_tweet_replies_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tweets;
