
-- Moderator permissions table
CREATE TABLE public.moderator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  can_ban_users boolean NOT NULL DEFAULT false,
  can_approve_videos boolean NOT NULL DEFAULT false,
  can_view_logs boolean NOT NULL DEFAULT false,
  can_delete_content boolean NOT NULL DEFAULT false,
  can_view_reports boolean NOT NULL DEFAULT true,
  can_manage_comments boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage all permissions"
  ON public.moderator_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view own permissions"
  ON public.moderator_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Security logs table
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  attempted_route text NOT NULL,
  ip_address text,
  user_agent text,
  action_type text NOT NULL DEFAULT 'unauthorized_access',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only owner can view security logs"
  ON public.security_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert security logs"
  ON public.security_logs FOR INSERT
  WITH CHECK (true);

-- App settings for maintenance mode
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Only owner can update app settings"
  ON public.app_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default maintenance mode setting
INSERT INTO public.app_settings (key, value) VALUES ('maintenance_mode', '{"enabled": false, "message": "التطبيق تحت الصيانة"}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_moderator_permissions_updated_at
  BEFORE UPDATE ON public.moderator_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
