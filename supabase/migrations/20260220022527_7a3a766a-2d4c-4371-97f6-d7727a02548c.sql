
-- Gift codes table for admin-generated codes
CREATE TABLE public.gift_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  coin_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  redeemed_by UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage all codes
CREATE POLICY "Admins can manage gift codes"
  ON public.gift_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view codes they redeemed
CREATE POLICY "Users can view their redeemed codes"
  ON public.gift_codes FOR SELECT
  USING (auth.uid() = redeemed_by);

-- Gift redemption history
CREATE TABLE public.gift_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  coin_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.gift_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert redemptions"
  ON public.gift_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Combo leaderboard table
CREATE TABLE public.combo_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID REFERENCES public.live_rooms(id),
  max_combo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.combo_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view combo leaderboard"
  ON public.combo_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their combos"
  ON public.combo_leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their combos"
  ON public.combo_leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for combo leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.combo_leaderboard;
