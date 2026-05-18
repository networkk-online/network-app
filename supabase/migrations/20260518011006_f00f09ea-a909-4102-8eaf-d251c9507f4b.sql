-- Harden Agora call signaling policies
DROP POLICY IF EXISTS "Participants can view their calls" ON public.agora_calls;
DROP POLICY IF EXISTS "Caller can create calls" ON public.agora_calls;
DROP POLICY IF EXISTS "Participants can update call status" ON public.agora_calls;

CREATE POLICY "Participants can view their Agora calls"
ON public.agora_calls
FOR SELECT
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated callers can create Agora calls"
ON public.agora_calls
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id AND caller_id <> receiver_id);

CREATE POLICY "Participants can update Agora calls"
ON public.agora_calls
FOR UPDATE
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Align call history with the Agora call lifecycle
ALTER TABLE public.call_history
ADD COLUMN IF NOT EXISTS agora_call_id UUID UNIQUE;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.call_history'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.call_history DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.call_history
ADD CONSTRAINT call_history_status_check
CHECK (status IN ('missed', 'accepted', 'rejected', 'ended', 'answered', 'declined', 'busy'));

CREATE INDEX IF NOT EXISTS idx_call_history_agora_call_id ON public.call_history(agora_call_id);
CREATE INDEX IF NOT EXISTS idx_call_history_participants_created ON public.call_history(caller_id, receiver_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.sync_agora_call_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  final_status text;
  duration_seconds integer;
BEGIN
  IF NEW.status NOT IN ('initiated', 'ringing', 'accepted', 'rejected', 'ended', 'missed') THEN
    RETURN NEW;
  END IF;

  final_status := CASE
    WHEN NEW.status = 'ended' THEN 'accepted'
    WHEN NEW.status = 'rejected' THEN 'rejected'
    WHEN NEW.status = 'missed' THEN 'missed'
    WHEN NEW.status = 'accepted' THEN 'accepted'
    ELSE 'missed'
  END;

  duration_seconds := CASE
    WHEN NEW.started_at IS NOT NULL AND NEW.ended_at IS NOT NULL
      THEN GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)))::integer)
    ELSE 0
  END;

  INSERT INTO public.call_history (
    agora_call_id,
    caller_id,
    receiver_id,
    call_type,
    status,
    started_at,
    ended_at,
    duration,
    created_at
  ) VALUES (
    NEW.id,
    NEW.caller_id,
    NEW.receiver_id,
    NEW.call_type,
    final_status,
    COALESCE(NEW.started_at, NEW.created_at),
    NEW.ended_at,
    duration_seconds,
    NEW.created_at
  )
  ON CONFLICT (agora_call_id) DO UPDATE SET
    status = EXCLUDED.status,
    started_at = EXCLUDED.started_at,
    ended_at = EXCLUDED.ended_at,
    duration = EXCLUDED.duration;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_agora_call_history_trigger ON public.agora_calls;
CREATE TRIGGER sync_agora_call_history_trigger
AFTER INSERT OR UPDATE OF status, started_at, ended_at ON public.agora_calls
FOR EACH ROW
EXECUTE FUNCTION public.sync_agora_call_history();