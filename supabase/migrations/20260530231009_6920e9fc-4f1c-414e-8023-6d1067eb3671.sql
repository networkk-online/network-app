
-- 1. activity_intel: restrict insert to service_role
DROP POLICY IF EXISTS "service insert activity_intel" ON public.activity_intel;
CREATE POLICY "service insert activity_intel" ON public.activity_intel
  FOR INSERT TO service_role WITH CHECK (true);

-- 2. financial_alerts: restrict insert to service_role
DROP POLICY IF EXISTS "service insert financial_alerts" ON public.financial_alerts;
CREATE POLICY "service insert financial_alerts" ON public.financial_alerts
  FOR INSERT TO service_role WITH CHECK (true);

-- 3. threat_flags: restrict insert to service_role
DROP POLICY IF EXISTS "service insert threat_flags" ON public.threat_flags;
CREATE POLICY "service insert threat_flags" ON public.threat_flags
  FOR INSERT TO service_role WITH CHECK (true);

-- 4. user_finances: remove user direct insert; only service_role / admins / triggers may create rows
DROP POLICY IF EXISTS "Users can insert their own finances" ON public.user_finances;

-- 5. profiles: revoke column-level SELECT for sensitive PII from anon and authenticated
REVOKE SELECT (phone_number, phone_country_code, birth_date, business_email, gender)
  ON public.profiles FROM anon, authenticated;
