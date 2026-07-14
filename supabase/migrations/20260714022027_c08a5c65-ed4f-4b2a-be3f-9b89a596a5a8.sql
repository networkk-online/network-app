ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;

ALTER TABLE public.live_streams
ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_live_streams_active_heartbeat
ON public.live_streams (host_id, status, last_heartbeat_at DESC)
WHERE status = 'live';

CREATE OR REPLACE FUNCTION public.refresh_profile_live_status(_host_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _host_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET is_live = EXISTS (
    SELECT 1
    FROM public.live_streams
    WHERE host_id = _host_id
      AND status = 'live'
      AND last_heartbeat_at > now() - interval '90 seconds'
  )
  WHERE id = _host_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_live_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_profile_live_status(NEW.host_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_profile_live_status(NEW.host_id);
    IF OLD.host_id IS DISTINCT FROM NEW.host_id THEN
      PERFORM public.refresh_profile_live_status(OLD.host_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_profile_live_status(OLD.host_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_live_status ON public.live_streams;
CREATE TRIGGER trg_sync_profile_live_status
AFTER INSERT OR UPDATE OF status, ended_at, host_id, last_heartbeat_at OR DELETE
ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_live_status();

UPDATE public.live_streams
SET status = 'ended', ended_at = COALESCE(ended_at, now())
WHERE status = 'live'
  AND last_heartbeat_at <= now() - interval '90 seconds';

UPDATE public.profiles p
SET is_live = EXISTS (
  SELECT 1
  FROM public.live_streams s
  WHERE s.host_id = p.id
    AND s.status = 'live'
    AND s.last_heartbeat_at > now() - interval '90 seconds'
);