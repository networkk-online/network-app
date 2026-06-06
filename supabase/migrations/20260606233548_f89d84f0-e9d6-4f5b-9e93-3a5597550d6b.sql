
-- ============ STORAGE: avatars ============
DROP POLICY IF EXISTS "avatars_auth_insert_v2" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_update_v2" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_delete_v2" ON storage.objects;

CREATE POLICY "avatars_owner_insert_v3" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars_owner_update_v3" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatars_owner_delete_v3" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============ STORAGE: covers ============
DROP POLICY IF EXISTS "Users can upload their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cover" ON storage.objects;

CREATE POLICY "covers_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "covers_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "covers_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'covers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============ STORAGE: post-images ============
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;

CREATE POLICY "post_images_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============ PROFILES: revoke PII columns from public roles ============
REVOKE SELECT (phone_number, phone_country_code, birth_date, gender, business_email)
  ON public.profiles FROM anon, authenticated;

-- ============ NOTIFICATIONS: tighten INSERT ============
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications as themselves"
ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND actor_id = auth.uid());

-- ============ PROFILES: username uniqueness ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END$$;
