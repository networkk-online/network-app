-- Create user_settings table for user preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  likes_enabled BOOLEAN DEFAULT true,
  comments_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  likes_notifications BOOLEAN DEFAULT true,
  comments_notifications BOOLEAN DEFAULT true,
  follows_notifications BOOLEAN DEFAULT true,
  allow_messages_from_non_friends BOOLEAN DEFAULT true,
  auto_backup_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add birth_date to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create index
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);