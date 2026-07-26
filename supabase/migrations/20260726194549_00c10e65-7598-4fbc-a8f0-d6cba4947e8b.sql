
-- =========================================================
-- LIVE STREAMING PREMIUM FOUNDATION
-- =========================================================

-- ---------- GIFT CATALOG ----------
CREATE TABLE IF NOT EXISTS public.live_gift_catalog (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_ar text,
  emoji text,
  icon_url text,
  category text NOT NULL CHECK (category IN ('popular','vip','luxury','funny','seasonal','legendary')),
  price_coins integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic','premium','super','legendary')),
  animation_key text,
  sound_key text,
  combo_enabled boolean NOT NULL DEFAULT true,
  leaderboard_points integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_gift_catalog TO anon, authenticated;
GRANT ALL ON public.live_gift_catalog TO service_role;
ALTER TABLE public.live_gift_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gift_catalog_public_read" ON public.live_gift_catalog
  FOR SELECT USING (true);
CREATE POLICY "gift_catalog_admin_write" ON public.live_gift_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_gift_catalog_updated
  BEFORE UPDATE ON public.live_gift_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- SUPER GIFT EVENTS ----------
CREATE TABLE IF NOT EXISTS public.live_super_gift_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid,
  host_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  gift_id text NOT NULL REFERENCES public.live_gift_catalog(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  vip_level text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_gift_stream ON public.live_super_gift_events(stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_super_gift_host ON public.live_super_gift_events(host_id, created_at DESC);

GRANT SELECT, INSERT ON public.live_super_gift_events TO authenticated;
GRANT ALL ON public.live_super_gift_events TO service_role;
ALTER TABLE public.live_super_gift_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_gift_read_all_auth" ON public.live_super_gift_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_gift_sender_insert" ON public.live_super_gift_events
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- ---------- VIP LEVELS ----------
CREATE TABLE IF NOT EXISTS public.live_vip_levels (
  user_id uuid PRIMARY KEY,
  tier text NOT NULL DEFAULT 'none' CHECK (tier IN ('none','bronze','silver','gold','platinum','diamond','royal','legend')),
  lifetime_spend numeric NOT NULL DEFAULT 0,
  entrance_effect text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_vip_levels TO authenticated;
GRANT ALL ON public.live_vip_levels TO service_role;
ALTER TABLE public.live_vip_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vip_read_all_auth" ON public.live_vip_levels
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vip_admin_write" ON public.live_vip_levels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vip_updated
  BEFORE UPDATE ON public.live_vip_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ENTRANCE EVENTS ----------
CREATE TABLE IF NOT EXISTS public.live_entrance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid,
  host_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  vip_tier text NOT NULL DEFAULT 'none',
  effect_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entrance_stream ON public.live_entrance_events(stream_id, created_at DESC);

GRANT SELECT, INSERT ON public.live_entrance_events TO authenticated;
GRANT ALL ON public.live_entrance_events TO service_role;
ALTER TABLE public.live_entrance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entrance_read_all_auth" ON public.live_entrance_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "entrance_self_insert" ON public.live_entrance_events
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

-- ---------- QUESTS ----------
CREATE TABLE IF NOT EXISTS public.live_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text,
  description text,
  metric text NOT NULL CHECK (metric IN ('likes','roses','followers','duration_minutes','diamonds','shares','comments','gifts')),
  target_value integer NOT NULL,
  reward_coins integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_quests TO anon, authenticated;
GRANT ALL ON public.live_quests TO service_role;
ALTER TABLE public.live_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quests_public_read" ON public.live_quests FOR SELECT USING (true);
CREATE POLICY "quests_admin_write" ON public.live_quests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_quests_updated
  BEFORE UPDATE ON public.live_quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- QUEST PROGRESS ----------
CREATE TABLE IF NOT EXISTS public.live_quest_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL,
  host_id uuid NOT NULL,
  quest_id uuid NOT NULL REFERENCES public.live_quests(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stream_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_quest_progress_stream ON public.live_quest_progress(stream_id);

GRANT SELECT, INSERT, UPDATE ON public.live_quest_progress TO authenticated;
GRANT ALL ON public.live_quest_progress TO service_role;
ALTER TABLE public.live_quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quest_progress_read_all_auth" ON public.live_quest_progress
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "quest_progress_host_write" ON public.live_quest_progress
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "quest_progress_host_update" ON public.live_quest_progress
  FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE TRIGGER trg_quest_progress_updated
  BEFORE UPDATE ON public.live_quest_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- LIVE GOALS ----------
CREATE TABLE IF NOT EXISTS public.live_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL,
  host_id uuid NOT NULL,
  title text NOT NULL,
  target_gift_id text REFERENCES public.live_gift_catalog(id) ON DELETE SET NULL,
  target_count integer NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  reward_coins integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_stream ON public.live_goals(stream_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_goals TO authenticated;
GRANT ALL ON public.live_goals TO service_role;
ALTER TABLE public.live_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_read_all_auth" ON public.live_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "goals_host_all" ON public.live_goals
  FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE TRIGGER trg_goals_updated
  BEFORE UPDATE ON public.live_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- LIVE ROUNDS ----------
CREATE TABLE IF NOT EXISTS public.live_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL,
  host_id uuid NOT NULL,
  round_number integer NOT NULL CHECK (round_number BETWEEN 1 AND 5),
  round_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  score jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rounds_stream ON public.live_rounds(stream_id, round_number);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_rounds TO authenticated;
GRANT ALL ON public.live_rounds TO service_role;
ALTER TABLE public.live_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rounds_read_all_auth" ON public.live_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "rounds_host_all" ON public.live_rounds
  FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE TRIGGER trg_rounds_updated
  BEFORE UPDATE ON public.live_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- LIVE SUMMARY ----------
CREATE TABLE IF NOT EXISTS public.live_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  peak_viewers integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  followers_gained integer NOT NULL DEFAULT 0,
  gift_income_coins integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  estimated_revenue_iqd numeric NOT NULL DEFAULT 0,
  top_supporters jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_summary_host ON public.live_summary(host_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.live_summary TO authenticated;
GRANT ALL ON public.live_summary TO service_role;
ALTER TABLE public.live_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "summary_read_all_auth" ON public.live_summary FOR SELECT TO authenticated USING (true);
CREATE POLICY "summary_host_write" ON public.live_summary
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "summary_host_update" ON public.live_summary
  FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE TRIGGER trg_summary_updated
  BEFORE UPDATE ON public.live_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- REALTIME ----------
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_super_gift_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_entrance_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quest_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rounds;

-- ---------- SEED GIFT CATALOG ----------
INSERT INTO public.live_gift_catalog (id, name, name_ar, emoji, category, price_coins, tier, animation_key, combo_enabled, leaderboard_points, sort_order)
VALUES
  ('rose',        'Rose',        'وردة',       '🌹', 'popular',   1,     'basic',     'rose',     true, 1,    10),
  ('heart',       'Heart',       'قلب',        '❤️', 'popular',   2,     'basic',     'heart',    true, 2,    20),
  ('coffee',      'Coffee',      'قهوة',       '☕', 'popular',   5,     'basic',     'coffee',   true, 5,    30),
  ('cake',        'Cake',        'كيكة',       '🎂', 'funny',     10,    'basic',     'cake',     true, 10,   40),
  ('teddy',       'Teddy Bear',  'دبدوب',      '🧸', 'funny',     20,    'premium',   'teddy',    true, 20,   50),
  ('ring',        'Ring',        'خاتم',       '💍', 'luxury',    100,   'premium',   'ring',     true, 100,  60),
  ('sportscar',   'Sports Car',  'سيارة',      '🚗', 'luxury',    500,   'super',     'supercar', true, 500,  70),
  ('yacht',       'Yacht',       'يخت',        '🛥',  'luxury',    1000,  'super',     'yacht',    true, 1000, 80),
  ('lion',        'Lion',        'أسد',        '🦁', 'vip',       800,   'super',     'lion',     true, 800,  90),
  ('rocket',      'Rocket',      'صاروخ',      '🚀', 'vip',       1200,  'super',     'rocket',   true, 1200, 100),
  ('diamond',     'Diamond',     'ألماسة',     '💎', 'legendary', 2000,  'legendary', 'diamond',  true, 2000, 110),
  ('crown',       'Royal Crown', 'تاج ملكي',   '👑', 'legendary', 3000,  'legendary', 'crown',    true, 3000, 120),
  ('dragon',      'Dragon',      'تنين',       '🐉', 'legendary', 5000,  'legendary', 'dragon',   true, 5000, 130),
  ('galaxy',      'Galaxy',      'مجرة',       '🌌', 'legendary', 8000,  'legendary', 'galaxy',   true, 8000, 140)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  emoji = EXCLUDED.emoji,
  category = EXCLUDED.category,
  price_coins = EXCLUDED.price_coins,
  tier = EXCLUDED.tier,
  animation_key = EXCLUDED.animation_key,
  leaderboard_points = EXCLUDED.leaderboard_points,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ---------- SEED QUESTS ----------
INSERT INTO public.live_quests (title, title_ar, metric, target_value, reward_coins, duration_seconds, sort_order)
VALUES
  ('Receive 50 Likes',       'احصل على 50 إعجاب',   'likes',            50,  50,   1800, 10),
  ('Receive 10 Roses',       'احصل على 10 ورود',    'roses',            10,  100,  1800, 20),
  ('Gain 20 Followers',      'اكسب 20 متابع',       'followers',        20,  200,  3600, 30),
  ('Stay Live 30 Minutes',   'ابقَ مباشراً 30 دقيقة', 'duration_minutes', 30,  150,  1800, 40),
  ('Receive 5 Diamonds',     'احصل على 5 ألماسات',  'diamonds',         5,   500,  3600, 50),
  ('Get 20 Shares',          'احصل على 20 مشاركة',  'shares',           20,  100,  1800, 60)
ON CONFLICT DO NOTHING;
