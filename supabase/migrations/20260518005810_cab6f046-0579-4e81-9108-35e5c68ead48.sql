
CREATE TABLE IF NOT EXISTS public.agora_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice','video')),
  channel_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','ringing','accepted','rejected','ended','missed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ended_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agora_calls_receiver_status ON public.agora_calls(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_agora_calls_caller_status ON public.agora_calls(caller_id, status);

ALTER TABLE public.agora_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls"
ON public.agora_calls FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Caller can create calls"
ON public.agora_calls FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update call status"
ON public.agora_calls FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE TRIGGER agora_calls_updated_at
BEFORE UPDATE ON public.agora_calls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.agora_calls;
ALTER TABLE public.agora_calls REPLICA IDENTITY FULL;
