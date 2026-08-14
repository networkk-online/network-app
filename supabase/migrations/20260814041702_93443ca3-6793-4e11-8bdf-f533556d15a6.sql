-- ============ 1. PERFORMANCE INDEXES (safe, additive) ============
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON public.likes (post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follow_events_follower ON public.follow_events (follower_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_user_created ON public.reels (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_created ON public.reels (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_created ON public.stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tweets_created ON public.tweets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_created ON public.deposits (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gift_ledger_created ON public.gift_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlights_user ON public.highlights (user_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_story ON public.highlight_stories (story_id);
CREATE INDEX IF NOT EXISTS idx_ad_interactions_user ON public.ad_interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_call_history_receiver ON public.call_history (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_moderators_stream_user ON public.live_moderators (stream_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_bans_stream_user ON public.live_bans (stream_id, user_id);
CREATE INDEX IF NOT EXISTS idx_live_guest_slots_stream ON public.live_guest_slots (stream_id);
CREATE INDEX IF NOT EXISTS idx_live_join_requests_room ON public.live_join_requests (room_id);
CREATE INDEX IF NOT EXISTS idx_live_pinned_stream ON public.live_pinned_messages (stream_id);
CREATE INDEX IF NOT EXISTS idx_live_treasure_stream ON public.live_treasure_box (stream_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status_created ON public.live_streams (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON public.login_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_otp_email_created ON public.login_otp_codes (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_combo_leaderboard_user ON public.combo_leaderboard (user_id);
CREATE INDEX IF NOT EXISTS idx_gift_redemptions_user ON public.gift_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_company_affiliation_company ON public.company_affiliation_requests (company_id);

-- ============ 2. RATE LIMITING ============
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_rate_limits_bucket_identifier
  ON public.rate_limits (bucket, identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits service only" ON public.rate_limits;
CREATE POLICY "rate_limits service only"
  ON public.rate_limits FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _bucket text,
  _identifier text,
  _max_hits integer,
  _window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.rate_limits;
BEGIN
  INSERT INTO public.rate_limits (bucket, identifier, hits, window_start)
  VALUES (_bucket, _identifier, 1, now())
  ON CONFLICT (bucket, identifier) DO UPDATE
    SET hits = CASE
          WHEN public.rate_limits.window_start < now() - make_interval(secs => _window_seconds)
          THEN 1 ELSE public.rate_limits.hits + 1 END,
        window_start = CASE
          WHEN public.rate_limits.window_start < now() - make_interval(secs => _window_seconds)
          THEN now() ELSE public.rate_limits.window_start END,
        updated_at = now()
  RETURNING * INTO _row;

  RETURN jsonb_build_object(
    'allowed', _row.hits <= _max_hits,
    'hits', _row.hits,
    'retry_after', GREATEST(0, _window_seconds - EXTRACT(EPOCH FROM (now() - _row.window_start))::int)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;
