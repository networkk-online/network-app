
-- 1. Activity Intelligence Log
CREATE TABLE IF NOT EXISTS public.activity_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  os TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_intel_created ON public.activity_intel(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_intel_user ON public.activity_intel(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_intel_type ON public.activity_intel(event_type);
ALTER TABLE public.activity_intel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read activity_intel" ON public.activity_intel FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "service insert activity_intel" ON public.activity_intel FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. Threat Flags
CREATE TABLE IF NOT EXISTS public.threat_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  auto_action TEXT DEFAULT 'none',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_threat_flags_status ON public.threat_flags(status, created_at DESC);
ALTER TABLE public.threat_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all threat_flags" ON public.threat_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "service insert threat_flags" ON public.threat_flags FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Account Restrictions
CREATE TABLE IF NOT EXISTS public.account_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  shadow_banned BOOLEAN NOT NULL DEFAULT false,
  verification_frozen BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  imposed_by UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.account_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all account_restrictions" ON public.account_restrictions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user reads own restriction" ON public.account_restrictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_account_restrictions_updated
  BEFORE UPDATE ON public.account_restrictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Financial Alerts
CREATE TABLE IF NOT EXISTS public.financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  window_minutes INTEGER DEFAULT 10,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_created ON public.financial_alerts(created_at DESC);
ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all financial_alerts" ON public.financial_alerts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "service insert financial_alerts" ON public.financial_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Settings: extortion keywords (use jsonb in app_settings if exists)
INSERT INTO public.app_settings (key, value)
VALUES ('extortion_keywords', '{"keywords":["ابتزاز","تهديد","فضيحة","blackmail","sextortion","scam","extort","صور خاصة","فلوس مقابل"]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Trigger: detect rapid/high-value gifts
CREATE OR REPLACE FUNCTION public.detect_financial_anomaly()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent_total NUMERIC;
  recent_count INTEGER;
BEGIN
  IF NEW.status = 'confirmed' THEN
    SELECT COALESCE(SUM(total_price),0), COUNT(*) INTO recent_total, recent_count
      FROM public.gift_ledger
      WHERE creator_id = NEW.creator_id
        AND status = 'confirmed'
        AND created_at > now() - interval '10 minutes';

    IF recent_total >= 100000 OR recent_count >= 20 THEN
      INSERT INTO public.financial_alerts (user_id, alert_type, amount, window_minutes, evidence)
      VALUES (NEW.creator_id, 'rapid_gifts', recent_total, 10,
        jsonb_build_object('count', recent_count, 'last_gift', NEW.id));

      INSERT INTO public.activity_intel (event_type, user_id, severity, metadata)
      VALUES ('gem_transfer_high', NEW.creator_id, 'warning',
        jsonb_build_object('amount', recent_total, 'count', recent_count));
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_detect_financial_anomaly ON public.gift_ledger;
CREATE TRIGGER trg_detect_financial_anomaly
  AFTER INSERT OR UPDATE ON public.gift_ledger
  FOR EACH ROW EXECUTE FUNCTION public.detect_financial_anomaly();
