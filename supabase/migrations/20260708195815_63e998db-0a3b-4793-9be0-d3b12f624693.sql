
-- 1. Deduplicate posts (same user, same content, same minute)
WITH dupes AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id, content, date_trunc('minute', created_at) ORDER BY created_at ASC, id ASC) AS rn
  FROM public.posts
  WHERE content IS NOT NULL AND length(trim(content)) > 0
)
DELETE FROM public.posts WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 2. Deduplicate tweets
WITH dupes AS (
  SELECT id,
         row_number() OVER (PARTITION BY user_id, content, date_trunc('minute', created_at) ORDER BY created_at ASC, id ASC) AS rn
  FROM public.tweets
  WHERE content IS NOT NULL AND length(trim(content)) > 0
)
DELETE FROM public.tweets WHERE id IN (SELECT id FROM dupes WHERE rn > 1);

-- 3. Profiles: account type + specialty
DO $$ BEGIN
  CREATE TYPE public.account_type_enum AS ENUM ('creator', 'personal', 'business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type public.account_type_enum;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;

GRANT SELECT (account_type, specialty) ON public.profiles TO anon;

-- 4. Family Supervision tables

-- family_links
CREATE TABLE IF NOT EXISTS public.family_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teen_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, teen_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_links TO authenticated;
GRANT ALL ON public.family_links TO service_role;
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent or teen can view link" ON public.family_links FOR SELECT TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);
CREATE POLICY "Parent can remove link" ON public.family_links FOR DELETE TO authenticated
  USING (auth.uid() = parent_id);
CREATE POLICY "Teen can remove link" ON public.family_links FOR DELETE TO authenticated
  USING (auth.uid() = teen_id);

-- family_invite_codes
CREATE TABLE IF NOT EXISTS public.family_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invite_codes TO authenticated;
GRANT ALL ON public.family_invite_codes TO service_role;
ALTER TABLE public.family_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent manages own codes" ON public.family_invite_codes FOR ALL TO authenticated
  USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);

-- family_restrictions
CREATE TABLE IF NOT EXISTS public.family_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.family_links(id) ON DELETE CASCADE UNIQUE,
  dm_scope text NOT NULL DEFAULT 'friends' CHECK (dm_scope IN ('everyone','friends','nobody')),
  content_filter_level text NOT NULL DEFAULT 'standard' CHECK (content_filter_level IN ('off','standard','strict')),
  daily_time_limit_minutes int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_restrictions TO authenticated;
GRANT ALL ON public.family_restrictions TO service_role;
ALTER TABLE public.family_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parent or teen can view restrictions" ON public.family_restrictions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_links l WHERE l.id = family_restrictions.link_id AND (l.parent_id = auth.uid() OR l.teen_id = auth.uid())));
CREATE POLICY "Parent can upsert restrictions" ON public.family_restrictions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.family_links l WHERE l.id = link_id AND l.parent_id = auth.uid()));
CREATE POLICY "Parent can update restrictions" ON public.family_restrictions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.family_links l WHERE l.id = family_restrictions.link_id AND l.parent_id = auth.uid()));

-- session activity for screen-time
CREATE TABLE IF NOT EXISTS public.app_session_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT (now()::date),
  duration_seconds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_session_user_date ON public.app_session_activity (user_id, session_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_session_activity TO authenticated;
GRANT ALL ON public.app_session_activity TO service_role;
ALTER TABLE public.app_session_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own sessions" ON public.app_session_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.family_links l WHERE l.teen_id = app_session_activity.user_id AND l.parent_id = auth.uid()));
CREATE POLICY "User can insert own sessions" ON public.app_session_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RPC to redeem an invite code (teen calls)
CREATE OR REPLACE FUNCTION public.redeem_family_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.family_invite_codes%ROWTYPE;
  v_link_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthenticated'); END IF;

  SELECT * INTO v_row FROM public.family_invite_codes WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_code'); END IF;
  IF v_row.used_by IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'already_used'); END IF;
  IF v_row.expires_at < now() THEN RETURN jsonb_build_object('success', false, 'error', 'expired'); END IF;
  IF v_row.parent_id = auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'cannot_link_self'); END IF;

  INSERT INTO public.family_links (parent_id, teen_id)
  VALUES (v_row.parent_id, auth.uid())
  ON CONFLICT (parent_id, teen_id) DO UPDATE SET created_at = family_links.created_at
  RETURNING id INTO v_link_id;

  UPDATE public.family_invite_codes SET used_by = auth.uid(), used_at = now() WHERE id = v_row.id;

  INSERT INTO public.family_restrictions (link_id) VALUES (v_link_id)
  ON CONFLICT (link_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'link_id', v_link_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_family_code(text) TO authenticated;

-- 5. Tighten profiles SELECT policies (drop overly-broad ones, keep column-level anon grants)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Authenticated can view profiles') THEN
    CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Anon can view profiles safe cols') THEN
    CREATE POLICY "Anon can view profiles safe cols" ON public.profiles FOR SELECT TO anon USING (true);
  END IF;
END $$;
