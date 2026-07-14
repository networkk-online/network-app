
-- =========================================================
-- RLS hardening: ensure authenticated users can upload/read
-- their own media across public buckets, and that posts /
-- stories / profiles tables accept authenticated writes.
-- =========================================================

-- ---------- public.posts ----------
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
CREATE POLICY "Users can create their own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- public.stories ----------
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories"
  ON public.stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories"
  ON public.stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- public.profiles ----------
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Restrict full PII exposure: authenticated users only see their own
-- row + non-sensitive columns from others via the profiles_public view.
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.posts, public.stories, public.profiles TO service_role;

-- ---------- storage.objects: unified per-user policies ----------
-- Buckets governed by "first folder must equal auth.uid()"
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['avatars','post-images','stories','reels','covers','videos','message-media']
  LOOP
    -- INSERT
    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_auth_insert_v4', b || '_auth_insert_v4', b);

    -- UPDATE
    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_auth_update_v4', b || '_auth_update_v4', b, b);

    -- DELETE
    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND (storage.foldername(name))[1] = auth.uid()::text);
    $f$, b || '_auth_delete_v4', b || '_auth_delete_v4', b);
  END LOOP;
END $$;

-- Public read access for the public buckets
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['avatars','post-images','stories','reels','covers','videos']
  LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR SELECT TO public
      USING (bucket_id = %L);
    $f$, b || '_public_read_v4', b || '_public_read_v4', b);
  END LOOP;
END $$;
