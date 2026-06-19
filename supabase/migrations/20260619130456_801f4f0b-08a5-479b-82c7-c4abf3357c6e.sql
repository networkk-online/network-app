
-- 1) login_otp_codes: add explicit deny-all policy (service role bypasses RLS)
DROP POLICY IF EXISTS "no_client_access_login_otp_codes" ON public.login_otp_codes;
CREATE POLICY "no_client_access_login_otp_codes"
  ON public.login_otp_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2) message-media bucket SELECT: allow uploader OR conversation participant
DROP POLICY IF EXISTS "Users can view media in their conversations" ON storage.objects;
CREATE POLICY "Users can view media in their conversations"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'message-media'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.conversation_participants cp
          ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = auth.uid()
          AND m.media_url LIKE '%' || storage.objects.name
      )
    )
  );

-- 3) Public-bucket listing: drop broad SELECT policies. Public file URLs still work
--    because public buckets are served directly by the storage CDN without policy checks.
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_select_v2" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view reels" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view stories" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible covers" ON storage.objects;
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read email-assets" ON storage.objects;

-- 4) RLS policy always true → require auth / restrict to service role
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert security logs" ON public.security_logs;
-- security_logs are written by edge functions via service role; no client insert needed.

DROP POLICY IF EXISTS "service insert activity_intel" ON public.activity_intel;
DROP POLICY IF EXISTS "service insert financial_alerts" ON public.financial_alerts;
DROP POLICY IF EXISTS "service insert threat_flags" ON public.threat_flags;
-- These tables are populated by triggers/edge functions running as service_role,
-- which bypasses RLS. No client-side INSERT policy needed.

-- 5) Lock down SECURITY DEFINER functions: revoke from anon/PUBLIC,
--    keep authenticated EXECUTE only on functions used at runtime by clients/policies.
REVOKE EXECUTE ON FUNCTION public.calculate_fame_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_add_participant_to_conversation(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_signals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_financial_anomaly() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_conversation_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_follow_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_follows_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_deposit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_comment_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_creator_donation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_financial_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_post_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_reel_comment_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_broadcast_donation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_gift_credit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_post_tip() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_wheel_spin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_tip(uuid, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_tip_v2(uuid, uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_agora_call_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_ad_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_all_fame_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_comment_replies_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_follow_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_follower_counts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reel_comment_replies_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reel_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reel_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_story_views_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_tweet_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_tweet_replies_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_tweet_retweets_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_fame_score() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_fame_score_on_follow() FROM PUBLIC, anon, authenticated;

-- 6) Fix mutable search_path on block_mutation
CREATE OR REPLACE FUNCTION public.block_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'compliance_logs are immutable';
END;
$$;
