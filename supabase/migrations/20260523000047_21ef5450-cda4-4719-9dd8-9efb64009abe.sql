CREATE TABLE IF NOT EXISTS public.login_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_otp_user ON public.login_otp_codes(user_id, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_login_otp_email ON public.login_otp_codes(lower(email), used, expires_at);
ALTER TABLE public.login_otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies = denied to anon/authenticated; service role bypasses RLS.