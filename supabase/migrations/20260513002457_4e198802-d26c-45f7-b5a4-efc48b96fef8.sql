
-- 1. Profiles: hide sensitive PII from anon
REVOKE SELECT (phone_number, birth_date, business_email, gender, phone_country_code) ON public.profiles FROM anon;

-- 2. Pinned Explore posts: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can manage pinned posts" ON public.pinned_explore_posts;
CREATE POLICY "Only admins can manage pinned posts" ON public.pinned_explore_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Push tokens: drop public SELECT
DROP POLICY IF EXISTS "Service can read all tokens" ON public.push_tokens;

-- 4. App settings: restrict reads to authenticated
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- 5. user_gems: drop user-owned UPDATE/INSERT (server-only)
DROP POLICY IF EXISTS "Users can update their own gems" ON public.user_gems;
DROP POLICY IF EXISTS "Users can insert their own gems" ON public.user_gems;

-- 6. Deposit receipts: private bucket + owner/admin only SELECT
UPDATE storage.buckets SET public = false WHERE id = 'deposit-receipts';
DROP POLICY IF EXISTS "Anyone can view deposit receipts" ON storage.objects;
CREATE POLICY "Owner or admin can view deposit receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'deposit-receipts'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
