
-- ============ MISSIONS ============
CREATE TABLE public.live_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('daily','weekly','monthly')),
  requirement_type TEXT NOT NULL,
  requirement_target INTEGER NOT NULL DEFAULT 1,
  reward_coins INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_missions TO authenticated, anon;
GRANT ALL ON public.live_missions TO service_role;
ALTER TABLE public.live_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_public_read" ON public.live_missions FOR SELECT USING (true);
CREATE POLICY "missions_admin_write" ON public.live_missions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_missions_updated BEFORE UPDATE ON public.live_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.live_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.live_missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_mission_progress TO authenticated;
GRANT ALL ON public.live_mission_progress TO service_role;
ALTER TABLE public.live_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_own_read" ON public.live_mission_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "mp_own_write" ON public.live_mission_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_mp_updated BEFORE UPDATE ON public.live_mission_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEADERBOARDS ============
CREATE TABLE public.live_leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly','all')),
  kind TEXT NOT NULL CHECK (kind IN ('gifter','supporter','viewer','fan')),
  rank INTEGER NOT NULL,
  user_id UUID NOT NULL,
  score BIGINT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_leaderboard_snapshots TO authenticated, anon;
GRANT ALL ON public.live_leaderboard_snapshots TO service_role;
ALTER TABLE public.live_leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_public_read" ON public.live_leaderboard_snapshots FOR SELECT USING (true);
CREATE INDEX idx_lb_period_kind ON public.live_leaderboard_snapshots(period, kind, rank);

-- ============ PK BATTLES ============
CREATE TABLE public.live_pk_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  opponent_id UUID,
  host_stream_id UUID,
  opponent_stream_id UUID,
  host_score BIGINT NOT NULL DEFAULT 0,
  opponent_score BIGINT NOT NULL DEFAULT 0,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','ended','cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_pk_battles TO authenticated, anon;
GRANT INSERT, UPDATE ON public.live_pk_battles TO authenticated;
GRANT ALL ON public.live_pk_battles TO service_role;
ALTER TABLE public.live_pk_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pk_public_read" ON public.live_pk_battles FOR SELECT USING (true);
CREATE POLICY "pk_host_write" ON public.live_pk_battles FOR ALL TO authenticated
  USING (host_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (host_id = auth.uid() OR opponent_id = auth.uid());
CREATE TRIGGER trg_pk_updated BEFORE UPDATE ON public.live_pk_battles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TREASURE BOX ============
CREATE TABLE public.live_treasure_box (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','diamond')),
  reward_coins INTEGER NOT NULL DEFAULT 100,
  opened_by UUID,
  opened_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_treasure_box TO authenticated, anon;
GRANT INSERT, UPDATE ON public.live_treasure_box TO authenticated;
GRANT ALL ON public.live_treasure_box TO service_role;
ALTER TABLE public.live_treasure_box ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tb_public_read" ON public.live_treasure_box FOR SELECT USING (true);
CREATE POLICY "tb_host_create" ON public.live_treasure_box FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());
CREATE POLICY "tb_viewer_open" ON public.live_treasure_box FOR UPDATE TO authenticated
  USING (opened_by IS NULL) WITH CHECK (opened_by = auth.uid());

-- ============ PINNED MESSAGES ============
CREATE TABLE public.live_pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  message TEXT NOT NULL,
  pinned_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_pinned_messages TO authenticated, anon;
GRANT INSERT, DELETE ON public.live_pinned_messages TO authenticated;
GRANT ALL ON public.live_pinned_messages TO service_role;
ALTER TABLE public.live_pinned_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm_public_read" ON public.live_pinned_messages FOR SELECT USING (true);
CREATE POLICY "pm_host_write" ON public.live_pinned_messages FOR ALL TO authenticated
  USING (host_id = auth.uid() OR pinned_by = auth.uid())
  WITH CHECK (host_id = auth.uid() OR pinned_by = auth.uid());

-- ============ MODERATORS ============
CREATE TABLE public.live_moderators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  user_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stream_id, user_id)
);
GRANT SELECT ON public.live_moderators TO authenticated, anon;
GRANT INSERT, DELETE ON public.live_moderators TO authenticated;
GRANT ALL ON public.live_moderators TO service_role;
ALTER TABLE public.live_moderators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod_public_read" ON public.live_moderators FOR SELECT USING (true);
CREATE POLICY "mod_host_write" ON public.live_moderators FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

-- ============ BANS ============
CREATE TABLE public.live_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stream_id, user_id)
);
GRANT SELECT ON public.live_bans TO authenticated;
GRANT INSERT, DELETE ON public.live_bans TO authenticated;
GRANT ALL ON public.live_bans TO service_role;
ALTER TABLE public.live_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans_stakeholder_read" ON public.live_bans FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR user_id = auth.uid() OR banned_by = auth.uid());
CREATE POLICY "bans_host_write" ON public.live_bans FOR ALL TO authenticated
  USING (host_id = auth.uid() OR banned_by = auth.uid())
  WITH CHECK (host_id = auth.uid() OR banned_by = auth.uid());

-- ============ GUEST SLOTS ============
CREATE TABLE public.live_guest_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 0 AND slot_index <= 8),
  guest_user_id UUID,
  status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty','requested','accepted','muted','removed')),
  requested_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stream_id, slot_index)
);
GRANT SELECT ON public.live_guest_slots TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.live_guest_slots TO authenticated;
GRANT ALL ON public.live_guest_slots TO service_role;
ALTER TABLE public.live_guest_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gs_public_read" ON public.live_guest_slots FOR SELECT USING (true);
CREATE POLICY "gs_host_write" ON public.live_guest_slots FOR ALL TO authenticated
  USING (host_id = auth.uid() OR guest_user_id = auth.uid())
  WITH CHECK (host_id = auth.uid() OR guest_user_id = auth.uid());
CREATE TRIGGER trg_gs_updated BEFORE UPDATE ON public.live_guest_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_pk_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_treasure_box;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_pinned_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_moderators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_bans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_guest_slots;

-- ============ SEED MISSIONS ============
INSERT INTO public.live_missions (title, title_ar, description, kind, requirement_type, requirement_target, reward_coins, icon, sort_order) VALUES
  ('Receive 50 Likes','استلم 50 إعجاب','Get 50 likes during your live','daily','receive_likes',50,20,'❤️',1),
  ('Receive 10 Gifts','استلم 10 هدايا','Receive at least 10 gifts','daily','receive_gifts',10,50,'🎁',2),
  ('Stream 30 min','بث لمدة 30 دقيقة','Stay live for 30 minutes','daily','stream_minutes',30,30,'⏱️',3),
  ('Invite a Guest','ادعُ ضيفاً','Invite one guest to your live','daily','invite_guests',1,15,'👥',4),
  ('Gain 5 Followers','اكسب 5 متابعين','Gain 5 new followers','weekly','gain_followers',5,100,'⭐',5),
  ('Weekly 200 Gifts','200 هدية أسبوعياً','Receive 200 gifts this week','weekly','receive_gifts',200,500,'💎',6),
  ('Monthly Legend','أسطورة الشهر','Stream for 20 hours this month','monthly','stream_minutes',1200,2000,'👑',7)
ON CONFLICT DO NOTHING;

-- ============ SEED NEW GIFTS ============
INSERT INTO public.live_gift_catalog (id, name, name_ar, emoji, category, price_coins, tier, animation_key, combo_enabled, leaderboard_points, sort_order) VALUES
  ('motorcycle','Motorcycle','دراجة نارية','🏍️','luxury',300,'super','ride',true,300,15),
  ('jet','Private Jet','طائرة خاصة','🛩️','legendary',6000,'legendary','fly',false,6000,16),
  ('castle','Castle','قصر','🏰','legendary',10000,'legendary','castle',false,10000,17),
  ('phoenix','Phoenix','عنقاء','🐦‍🔥','legendary',12000,'legendary','phoenix',false,12000,18)
ON CONFLICT (id) DO NOTHING;
