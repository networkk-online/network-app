
-- Drop the existing conflicting policy
DROP POLICY IF EXISTS "Only owner can view security logs" ON public.security_logs;

-- Re-create it
CREATE POLICY "Only owner can view security logs"
ON public.security_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default maintenance_mode setting
INSERT INTO public.app_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "النظام تحت الصيانة"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
