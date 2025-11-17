-- Add columns for phone with international key
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+964';

-- Add business profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_business_account BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Add location columns to posts, reels, stories
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lat NUMERIC;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lng NUMERIC;

ALTER TABLE reels ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS location_lat NUMERIC;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS location_lng NUMERIC;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS location_lat NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS location_lng NUMERIC;

-- Add music/audio columns to posts, reels, stories
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS music_url TEXT;

ALTER TABLE reels ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE reels ADD COLUMN IF NOT EXISTS music_url TEXT;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_title TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_artist TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_url TEXT;

-- Add mentions column to posts, reels
ALTER TABLE posts ADD COLUMN IF NOT EXISTS mentions TEXT[];
ALTER TABLE reels ADD COLUMN IF NOT EXISTS mentions TEXT[];

-- Add story type and interactive content
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'media';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS question_text TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS poll_question TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS poll_options JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS poll_votes JSONB DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS allow_story_replies BOOLEAN DEFAULT true;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS sticker_data JSONB;

-- Create story_comments table
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create story_replies table for direct replies/DMs
CREATE TABLE IF NOT EXISTS story_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create question_responses table for story questions
CREATE TABLE IF NOT EXISTS story_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add message settings columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS view_once BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS view_twice BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_sender BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_receiver BOOLEAN DEFAULT false;

-- Add conversation settings
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_by UUID[];
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pinned_by UUID[];

-- Create public_stories table for shared/multi-use stories
CREATE TABLE IF NOT EXISTS public_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  created_by UUID NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create public_story_usage to track who used it
CREATE TABLE IF NOT EXISTS public_story_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_story_id UUID NOT NULL REFERENCES public_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for story_comments
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view story comments"
  ON story_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can add story comments"
  ON story_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their story comments"
  ON story_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for story_replies
ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their story replies"
  ON story_replies FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send story replies"
  ON story_replies FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for story_question_responses
ALTER TABLE story_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story owner can view question responses"
  ON story_question_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_question_responses.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit question responses"
  ON story_question_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for public_stories
ALTER TABLE public_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active public stories"
  ON public_stories FOR SELECT
  USING (is_active = true AND start_date <= NOW() AND end_date >= NOW());

CREATE POLICY "Admins can manage public stories"
  ON public_stories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for public_story_usage
ALTER TABLE public_story_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their public story usage"
  ON public_story_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record public story usage"
  ON public_story_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_story_id ON story_replies(story_id);
CREATE INDEX IF NOT EXISTS idx_story_question_responses_story_id ON story_question_responses(story_id);
CREATE INDEX IF NOT EXISTS idx_public_stories_active ON public_stories(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(location);
CREATE INDEX IF NOT EXISTS idx_reels_location ON reels(location);
CREATE INDEX IF NOT EXISTS idx_stories_location ON stories(location);
CREATE INDEX IF NOT EXISTS idx_posts_mentions ON posts USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_reels_mentions ON reels USING GIN(mentions);