-- ============ Network TV V4 schema ============
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allow_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_sharing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_embedding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS watch_seconds bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_count integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.videos ADD CONSTRAINT videos_visibility_chk
    CHECK (visibility IN ('public','followers','subscribers','unlisted','private'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.video_comments
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- ============ visibility helper ============
CREATE OR REPLACE FUNCTION public.can_watch_video(_video_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.videos v
    WHERE v.id = _video_id
      AND v.deleted_at IS NULL
      AND (
        v.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR (
          v.is_published = true
          AND (v.scheduled_at IS NULL OR v.scheduled_at <= now())
          AND (
            v.visibility IN ('public','unlisted')
            OR (v.visibility = 'followers' AND EXISTS (
                  SELECT 1 FROM public.follows f
                  WHERE f.following_id = v.user_id AND f.follower_id = auth.uid()))
            OR (v.visibility = 'subscribers' AND EXISTS (
                  SELECT 1 FROM public.user_subscriptions s
                  WHERE s.user_id = auth.uid() AND s.status = 'active'
                    AND coalesce(s.plan_id,'free') <> 'free'
                    AND (s.expires_at IS NULL OR s.expires_at > now())))
          )
        )
      )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_watch_video(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_watch_video(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can view published videos" ON public.videos;
CREATE POLICY "Videos visible per visibility rules" ON public.videos FOR SELECT
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    deleted_at IS NULL
    AND is_published = true
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND (
      visibility IN ('public','unlisted')
      OR (visibility = 'followers' AND EXISTS (
            SELECT 1 FROM public.follows f
            WHERE f.following_id = videos.user_id AND f.follower_id = auth.uid()))
      OR (visibility = 'subscribers' AND EXISTS (
            SELECT 1 FROM public.user_subscriptions s
            WHERE s.user_id = auth.uid() AND s.status = 'active'
              AND coalesce(s.plan_id,'free') <> 'free'
              AND (s.expires_at IS NULL OR s.expires_at > now())))
    )
  )
);

-- ============ views ============
CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  viewer_id uuid,
  session_key text,
  watch_seconds integer NOT NULL DEFAULT 0,
  device text,
  source text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_views TO authenticated;
GRANT ALL ON public.video_views TO service_role;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators read own video views" ON public.video_views;
CREATE POLICY "Creators read own video views" ON public.video_views FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND (v.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE INDEX IF NOT EXISTS idx_video_views_video_created ON public.video_views(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer ON public.video_views(viewer_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_video_view(_video_id uuid, _watch_seconds integer DEFAULT 0, _device text DEFAULT NULL, _source text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _recent int; _secs int := least(greatest(coalesce(_watch_seconds,0),0), 86400);
BEGIN
  IF NOT public.can_watch_video(_video_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_allowed');
  END IF;
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;
  SELECT count(*) INTO _recent FROM public.video_views
   WHERE video_id = _video_id AND viewer_id = _uid AND created_at > now() - interval '30 minutes';
  IF _recent > 0 THEN
    UPDATE public.video_views SET watch_seconds = greatest(watch_seconds, _secs)
     WHERE id = (SELECT id FROM public.video_views WHERE video_id=_video_id AND viewer_id=_uid ORDER BY created_at DESC LIMIT 1);
    RETURN jsonb_build_object('success', true, 'counted', false);
  END IF;
  INSERT INTO public.video_views(video_id, viewer_id, watch_seconds, device, source)
  VALUES (_video_id, _uid, _secs, left(coalesce(_device,''),40), left(coalesce(_source,''),40));
  UPDATE public.videos SET views_count = coalesce(views_count,0) + 1,
                           watch_seconds = coalesce(watch_seconds,0) + _secs
   WHERE id = _video_id;
  RETURN jsonb_build_object('success', true, 'counted', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.record_video_view(uuid,integer,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_video_view(uuid,integer,text,text) TO authenticated, service_role;

-- ============ saved / watch later ============
CREATE TABLE IF NOT EXISTS public.video_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'save',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.video_saves TO authenticated;
GRANT ALL ON public.video_saves TO service_role;
ALTER TABLE public.video_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saves" ON public.video_saves;
CREATE POLICY "Users manage own saves" ON public.video_saves FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ watch history ============
CREATE TABLE IF NOT EXISTS public.video_watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  position_seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_watch_history TO authenticated;
GRANT ALL ON public.video_watch_history TO service_role;
ALTER TABLE public.video_watch_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own watch history" ON public.video_watch_history;
CREATE POLICY "Users manage own watch history" ON public.video_watch_history FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.video_watch_history(user_id, updated_at DESC);

-- ============ comment moderation by creator ============
DROP POLICY IF EXISTS "Anyone can view video comments" ON public.video_comments;
CREATE POLICY "View video comments" ON public.video_comments FOR SELECT
USING (
  is_hidden = false
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Creators moderate comments on own videos" ON public.video_comments;
CREATE POLICY "Creators moderate comments on own videos" ON public.video_comments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.user_id = auth.uid()));
DROP POLICY IF EXISTS "Creators delete comments on own videos" ON public.video_comments;
CREATE POLICY "Creators delete comments on own videos" ON public.video_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND v.user_id = auth.uid()));

-- ============ indexes ============
CREATE INDEX IF NOT EXISTS idx_videos_feed ON public.videos(is_published, visibility, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_views ON public.videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_comments_video ON public.video_comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_likes_video ON public.video_likes(video_id);
NOTIFY pgrst, 'reload schema';