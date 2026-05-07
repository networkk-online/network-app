-- 1) PROFILES: hide phone columns from public/anon reads (column-level grants)
REVOKE SELECT (phone_number, phone_country_code) ON public.profiles FROM anon;
REVOKE SELECT (phone_number, phone_country_code) ON public.profiles FROM authenticated;
-- Allow the owner to read their own phone via a SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS TABLE(phone_number text, phone_country_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT phone_number, phone_country_code FROM public.profiles WHERE id = auth.uid();
$$;
-- Restore column SELECT for admins/moderators via has_role check is not possible via grants;
-- staff pages already query as admin role and this revoke applies to anon/authenticated PostgREST.
-- Re-grant to service_role (used by edge functions / admin tools)
GRANT SELECT (phone_number, phone_country_code) ON public.profiles TO service_role;

-- 2) NOTIFICATIONS: require authentication on INSERT
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3) STORY_VIEWS: restrict reads to viewer or story owner
DROP POLICY IF EXISTS "Anyone can view story views" ON public.story_views;
CREATE POLICY "Story owner or viewer can read story views"
ON public.story_views
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.stories s
    WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
  )
);

-- 4) BROADCAST_DONATIONS: hide internal financial split from public
DROP POLICY IF EXISTS "Anyone can view donations" ON public.broadcast_donations;
CREATE POLICY "Donor, creator, or admin can read donations"
ON public.broadcast_donations
FOR SELECT
TO authenticated
USING (
  auth.uid() = donor_user_id
  OR auth.uid() = creator_user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
-- Public-safe view (no platform_fee / creator_earning) for live broadcast UI
CREATE OR REPLACE VIEW public.broadcast_donations_public AS
SELECT id, broadcast_id, donor_user_id, creator_user_id, amount, message, created_at
FROM public.broadcast_donations;
GRANT SELECT ON public.broadcast_donations_public TO anon, authenticated;

-- 5) Function search_path hardening for legacy function
CREATE OR REPLACE FUNCTION public.update_follower_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$function$;