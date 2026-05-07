-- Add is_banned column for ban actions and ensure badge values support new admin badges
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- Allow admins to update profiles (ban/badge) via existing has_role
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update any profile'
  ) THEN
    CREATE POLICY "Admins can update any profile" ON public.profiles
      FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Allow admins to insert system notifications for any user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Admins can insert any notification'
  ) THEN
    CREATE POLICY "Admins can insert any notification" ON public.notifications
      FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;