
-- =========================================================================
-- 1) LIVE STREAMS REGISTRY (for G3142 monitoring + kill-switch)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL,
  channel_name TEXT NOT NULL UNIQUE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live','ended','killed')),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  killed_by UUID,
  killed_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON public.live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_host ON public.live_streams(host_id);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live streams"
  ON public.live_streams FOR SELECT
  USING (true);

CREATE POLICY "Hosts can create their streams"
  ON public.live_streams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their streams"
  ON public.live_streams FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_live_streams_updated
  BEFORE UPDATE ON public.live_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER TABLE public.live_streams REPLICA IDENTITY FULL;

-- =========================================================================
-- 2) FINANCE SETTINGS (admin-controllable commission rate)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.app_settings_finance (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings_finance (id, platform_commission_rate)
VALUES (1, 0.20)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read finance settings"
  ON public.app_settings_finance FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update finance settings"
  ON public.app_settings_finance FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- 3) GIFT LEDGER (double-entry record for every gift)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.gift_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  channel_name TEXT,
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE SET NULL,
  gift_id TEXT NOT NULL,
  gift_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  creator_earning NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','reversed')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_ledger_creator ON public.gift_ledger(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_ledger_sender  ON public.gift_ledger(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_ledger_stream  ON public.gift_ledger(stream_id);

ALTER TABLE public.gift_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sender or creator can view their gifts"
  ON public.gift_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- INSERTs only via SECURITY DEFINER edge function using service role; no RLS insert policy.

-- Trigger: credit creator on confirmed gift
CREATE OR REPLACE FUNCTION public.process_gift_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.user_finances (user_id, balance, total_earnings)
    VALUES (NEW.creator_id, NEW.creator_earning, NEW.creator_earning)
    ON CONFLICT (user_id) DO UPDATE SET
      balance = public.user_finances.balance + NEW.creator_earning,
      total_earnings = public.user_finances.total_earnings + NEW.creator_earning,
      updated_at = now();

    INSERT INTO public.transactions (user_id, admin_id, amount, type, status, notes)
    VALUES (
      NEW.creator_id,
      NEW.sender_id,
      NEW.creator_earning,
      'earning',
      'completed',
      'هدية بث (' || COALESCE(NEW.gift_name, NEW.gift_id) || ' x' || NEW.quantity ||
      ') - الأصلي: ' || NEW.total_price || ' بعد خصم ' || (NEW.commission_rate * 100) || '%'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gift_ledger_credit
  AFTER INSERT ON public.gift_ledger
  FOR EACH ROW EXECUTE FUNCTION public.process_gift_credit();

-- =========================================================================
-- 4) COMPLIANCE LOGS (immutable)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  context TEXT
);

CREATE INDEX IF NOT EXISTS idx_compliance_user ON public.compliance_logs(user_id, accepted_at DESC);

ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own compliance"
  ON public.compliance_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own compliance"
  ON public.compliance_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Block update / delete to keep immutable
CREATE OR REPLACE FUNCTION public.block_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'compliance_logs are immutable';
END;
$$;
CREATE TRIGGER trg_compliance_no_update BEFORE UPDATE ON public.compliance_logs
  FOR EACH ROW EXECUTE FUNCTION public.block_mutation();
CREATE TRIGGER trg_compliance_no_delete BEFORE DELETE ON public.compliance_logs
  FOR EACH ROW EXECUTE FUNCTION public.block_mutation();

-- =========================================================================
-- 5) SECURITY EVENTS (admin-only audit trail)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sec_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_user ON public.security_events(user_id);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can log own security events"
  ON public.security_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
