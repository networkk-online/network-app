-- Create call_signals table for WebRTC signaling
CREATE TABLE public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'call-request', 'call-accepted', 'call-rejected', 'call-ended'
  signal_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Users can see signals sent to them or from them
CREATE POLICY "Users can view their signals"
ON public.call_signals
FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can insert signals
CREATE POLICY "Users can insert signals"
ON public.call_signals
FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can delete their signals
CREATE POLICY "Users can delete their signals"
ON public.call_signals
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Enable realtime for call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;

-- Auto-delete old signals (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_signals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.call_signals 
  WHERE created_at < now() - interval '5 minutes';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_signals_trigger
AFTER INSERT ON public.call_signals
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_signals();