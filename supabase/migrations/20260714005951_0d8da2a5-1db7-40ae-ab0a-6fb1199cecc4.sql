
-- Revoke EXECUTE from public/anon/authenticated on internal trigger + helper functions
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'update_updated_at_column()',
    'notify_post_comment()',
    'handle_follow_notification()',
    'update_user_fame_score()',
    'handle_new_user()',
    'cleanup_old_signals()',
    'update_tweet_likes_count()',
    'update_post_likes_count()',
    'update_story_views_count()',
    'update_comment_replies_count()',
    'notify_post_like()',
    'update_conversation_timestamp()',
    'update_post_comments_count()',
    'process_wheel_spin()',
    'update_all_fame_scores()',
    'update_ad_stats()',
    'notify_reel_comment_reply()',
    'update_user_fame_score_on_follow()',
    'calculate_fame_score(uuid)',
    'update_reel_likes_count()',
    'update_tweet_replies_count()',
    'update_tweet_retweets_count()',
    'update_reel_comment_replies_count()',
    'update_reel_comments_count()',
    'update_follow_counts()',
    'notify_comment_reply()',
    'notify_creator_donation()',
    'notify_financial_transaction()',
    'handle_follows_change()',
    'update_follower_counts()',
    'process_broadcast_donation()',
    'process_gift_credit()',
    'block_mutation()',
    'detect_financial_anomaly()',
    'notify_admins_on_deposit()',
    'process_post_tip()',
    'sync_agora_call_history()'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- User-callable RPCs: revoke anon, keep authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_my_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_conversation_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_conversation_ids(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.can_add_participant_to_conversation(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_add_participant_to_conversation(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.send_tip(uuid, uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_tip(uuid, uuid, numeric, text) TO authenticated;

REVOKE ALL ON FUNCTION public.send_tip_v2(uuid, uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_tip_v2(uuid, uuid, numeric, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_family_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_family_code(text) TO authenticated;
