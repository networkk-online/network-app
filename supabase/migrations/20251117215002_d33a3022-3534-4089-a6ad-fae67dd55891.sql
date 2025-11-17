-- Create saved_reels table for saving reels
CREATE TABLE public.saved_reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reel_id)
);

-- Create saved_music table for saving music
CREATE TABLE public.saved_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  music_title TEXT NOT NULL,
  music_artist TEXT,
  music_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_hashtags table for following hashtags
CREATE TABLE public.saved_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hashtag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, hashtag)
);

-- Create reposts table for reposting content
CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND reel_id IS NULL) OR (post_id IS NULL AND reel_id IS NOT NULL))
);

-- Create blocked_users table for blocking users
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create reports table for reporting content
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_reason TEXT NOT NULL,
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.saved_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_reels
CREATE POLICY "Users can save reels" ON public.saved_reels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave reels" ON public.saved_reels
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their saved reels" ON public.saved_reels
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for saved_music
CREATE POLICY "Users can save music" ON public.saved_music
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saved music" ON public.saved_music
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their saved music" ON public.saved_music
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for saved_hashtags
CREATE POLICY "Users can follow hashtags" ON public.saved_hashtags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow hashtags" ON public.saved_hashtags
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their followed hashtags" ON public.saved_hashtags
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for reposts
CREATE POLICY "Users can repost content" ON public.reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their reposts" ON public.reposts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reposts" ON public.reposts
  FOR SELECT USING (true);

-- RLS Policies for blocked_users
CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock others" ON public.blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "Users can view their block list" ON public.blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

-- RLS Policies for reports
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_saved_reels_user_id ON public.saved_reels(user_id);
CREATE INDEX idx_saved_music_user_id ON public.saved_music(user_id);
CREATE INDEX idx_saved_hashtags_user_id ON public.saved_hashtags(user_id);
CREATE INDEX idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_status ON public.reports(status);