
-- Table to store OTP codes for admin 2FA
CREATE TABLE public.admin_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes'),
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_otp_codes ENABLE ROW LEVEL SECURITY;

-- Only the edge function (service role) manages this table
-- No client-side access needed
CREATE POLICY "No public access" ON public.admin_otp_codes FOR ALL USING (false);
