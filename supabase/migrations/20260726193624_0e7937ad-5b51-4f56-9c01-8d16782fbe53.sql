
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free','plus','creator','business','government');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active','pending','canceled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  renews_at timestamptz,
  canceled_at timestamptz,
  r_coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_subs_select_own" ON public.user_subscriptions;
CREATE POLICY "user_subs_select_own" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_subs_insert_own" ON public.user_subscriptions;
CREATE POLICY "user_subs_insert_own" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_subs_update_own" ON public.user_subscriptions;
CREATE POLICY "user_subs_update_own" ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_subs_updated_at ON public.user_subscriptions;
CREATE TRIGGER trg_user_subs_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_user_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ensure_user_subscription ON public.profiles;
CREATE TRIGGER trg_ensure_user_subscription AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_subscription();

INSERT INTO public.user_subscriptions (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
