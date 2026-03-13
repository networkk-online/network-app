
-- Create verification_logs table
CREATE TABLE public.verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  verification_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can insert logs
CREATE POLICY "Admins can insert verification logs"
ON public.verification_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can view logs
CREATE POLICY "Admins can view verification logs"
ON public.verification_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Only admins can update verification fields on profiles
CREATE POLICY "Admins can update any profile verification"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
