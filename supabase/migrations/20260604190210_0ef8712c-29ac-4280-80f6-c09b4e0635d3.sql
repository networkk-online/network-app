
-- System broadcasts table (admin pushes to all users)
CREATE TABLE public.system_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'info',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_broadcasts TO authenticated, anon;
GRANT INSERT, DELETE ON public.system_broadcasts TO authenticated;
GRANT ALL ON public.system_broadcasts TO service_role;
ALTER TABLE public.system_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read broadcasts"
  ON public.system_broadcasts FOR SELECT
  USING (true);

CREATE POLICY "admins can insert broadcasts"
  ON public.system_broadcasts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins can delete broadcasts"
  ON public.system_broadcasts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_broadcasts;
ALTER TABLE public.system_broadcasts REPLICA IDENTITY FULL;

-- Notify admins on new deposit
CREATE OR REPLACE FUNCTION public.notify_admins_on_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  sender_name TEXT;
BEGIN
  SELECT COALESCE(username, full_name, 'مستخدم') INTO sender_name
  FROM public.profiles WHERE id = NEW.user_id;

  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, actor_id, type, content)
    VALUES (
      admin_record.user_id,
      NEW.user_id,
      'deposit_request',
      'طلب تعبئة جديد بقيمة ' || NEW.amount || ' IQD من ' || sender_name
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_deposit ON public.deposits;
CREATE TRIGGER trg_notify_admins_on_deposit
  AFTER INSERT ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_deposit();
