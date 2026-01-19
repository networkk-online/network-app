-- Create call settings table
CREATE TABLE public.call_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    -- Call types enabled
    voice_calls_enabled BOOLEAN DEFAULT true,
    video_calls_enabled BOOLEAN DEFAULT true,
    auto_quality BOOLEAN DEFAULT true,
    -- Who can call
    who_can_call TEXT DEFAULT 'everyone' CHECK (who_can_call IN ('everyone', 'friends', 'followers', 'nobody', 'custom')),
    custom_allowed_users TEXT[] DEFAULT '{}',
    -- Notifications
    in_app_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    call_sound BOOLEAN DEFAULT true,
    vibration BOOLEAN DEFAULT true,
    mute_duration INTEGER DEFAULT 0,
    mute_until TIMESTAMP WITH TIME ZONE,
    -- Privacy
    block_unverified BOOLEAN DEFAULT false,
    hide_online_status BOOLEAN DEFAULT false,
    hide_call_duration BOOLEAN DEFAULT false,
    -- Audio/Video defaults
    default_mic_muted BOOLEAN DEFAULT false,
    default_camera_off BOOLEAN DEFAULT true,
    noise_reduction BOOLEAN DEFAULT true,
    echo_cancellation BOOLEAN DEFAULT true,
    -- Security
    end_to_end_encryption BOOLEAN DEFAULT true,
    prevent_recording BOOLEAN DEFAULT true,
    recording_alert BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Muted callers table (mute specific users without blocking)
CREATE TABLE public.muted_callers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    muted_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, muted_user_id)
);

-- Call history table
CREATE TABLE public.call_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    status TEXT NOT NULL CHECK (status IN ('missed', 'answered', 'declined', 'busy')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_callers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_settings
CREATE POLICY "Users can view their own call settings"
ON public.call_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call settings"
ON public.call_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own call settings"
ON public.call_settings FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for muted_callers
CREATE POLICY "Users can view their muted callers"
ON public.muted_callers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their muted callers"
ON public.muted_callers FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for call_history
CREATE POLICY "Users can view their call history"
ON public.call_history FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert call history"
ON public.call_history FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their call history"
ON public.call_history FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Trigger for updated_at
CREATE TRIGGER update_call_settings_updated_at
BEFORE UPDATE ON public.call_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for call_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_history;