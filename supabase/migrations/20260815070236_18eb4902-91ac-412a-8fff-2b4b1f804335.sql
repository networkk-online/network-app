-- =========================================================
-- FINANCIAL HARDENING: server-authoritative economy
-- =========================================================

-- 1) Append-only financial audit log --------------------------------
CREATE TABLE IF NOT EXISTS public.finance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  user_id uuid,
  operation text NOT NULL,
  wallet text NOT NULL,
  amount numeric,
  balance_before numeric,
  balance_after numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.finance_audit_log TO authenticated;
GRANT ALL ON public.finance_audit_log TO service_role;
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_audit_admin_read" ON public.finance_audit_log;
CREATE POLICY "fin_audit_admin_read" ON public.finance_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "fin_audit_own_read" ON public.finance_audit_log;
CREATE POLICY "fin_audit_own_read" ON public.finance_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- append-only: no client INSERT/UPDATE/DELETE policies at all
CREATE INDEX IF NOT EXISTS idx_finance_audit_user ON public.finance_audit_log(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_finance_event(
  _user_id uuid, _operation text, _wallet text, _amount numeric,
  _before numeric, _after numeric, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.finance_audit_log(actor_id, user_id, operation, wallet, amount, balance_before, balance_after, metadata)
  VALUES (auth.uid(), _user_id, _operation, _wallet, _amount, _before, _after, COALESCE(_metadata,'{}'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.log_finance_event(uuid,text,text,numeric,numeric,numeric,jsonb) FROM PUBLIC, anon, authenticated;

-- 2) Never allow negative balances ----------------------------------
CREATE OR REPLACE FUNCTION public.guard_non_negative_balance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.balance IS NOT NULL AND NEW.balance < 0 THEN
    RAISE EXCEPTION 'negative_balance_not_allowed';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gems_non_negative ON public.user_gems;
CREATE TRIGGER trg_gems_non_negative BEFORE INSERT OR UPDATE ON public.user_gems
  FOR EACH ROW EXECUTE FUNCTION public.guard_non_negative_balance();

DROP TRIGGER IF EXISTS trg_finances_non_negative ON public.user_finances;
CREATE TRIGGER trg_finances_non_negative BEFORE INSERT OR UPDATE ON public.user_finances
  FOR EACH ROW EXECUTE FUNCTION public.guard_non_negative_balance();

-- 3) Audit every wallet mutation ------------------------------------
CREATE OR REPLACE FUNCTION public.audit_wallet_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  before_bal numeric := CASE WHEN TG_OP = 'UPDATE' THEN OLD.balance ELSE 0 END;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.balance IS NOT DISTINCT FROM NEW.balance THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.finance_audit_log(actor_id, user_id, operation, wallet, amount, balance_before, balance_after, metadata)
  VALUES (auth.uid(), NEW.user_id, lower(TG_OP), TG_TABLE_NAME, NEW.balance - before_bal, before_bal, NEW.balance, '{}'::jsonb);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_audit_user_gems ON public.user_gems;
CREATE TRIGGER trg_audit_user_gems AFTER INSERT OR UPDATE ON public.user_gems
  FOR EACH ROW EXECUTE FUNCTION public.audit_wallet_change();

DROP TRIGGER IF EXISTS trg_audit_user_finances ON public.user_finances;
CREATE TRIGGER trg_audit_user_finances AFTER INSERT OR UPDATE ON public.user_finances
  FOR EACH ROW EXECUTE FUNCTION public.audit_wallet_change();

-- 4) Rewards wheel: server decides the prize -------------------------
DROP POLICY IF EXISTS "Users can insert their own spins" ON public.wheel_spins;

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  s RECORD;
  used int;
  prize int;
  new_balance int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('wheel_spin', 0), hashtextextended(uid::text, 0));

  SELECT * INTO s FROM public.wheel_settings ORDER BY updated_at DESC LIMIT 1;
  IF s IS NULL OR NOT s.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'wheel_disabled');
  END IF;

  SELECT count(*) INTO used FROM public.wheel_spins
   WHERE user_id = uid AND created_at >= date_trunc('day', now());

  IF used >= GREATEST(s.spins_per_day, 0) THEN
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit_reached');
  END IF;

  prize := GREATEST(COALESCE(s.default_prize, 0), 0);
  IF NOT s.guaranteed_win AND random() < 0.25 THEN prize := 0; END IF;

  INSERT INTO public.wheel_spins(user_id, points_won) VALUES (uid, prize);

  SELECT balance INTO new_balance FROM public.user_gems WHERE user_id = uid;

  PERFORM public.log_finance_event(uid, 'wheel_spin', 'user_gems', prize, NULL, new_balance,
    jsonb_build_object('spins_used', used + 1));

  RETURN jsonb_build_object('success', true, 'prize', prize,
    'balance', COALESCE(new_balance, prize),
    'spins_left', GREATEST(s.spins_per_day - used - 1, 0));
END; $$;
REVOKE ALL ON FUNCTION public.spin_wheel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;

-- 5) Gift code redemption: fully server-side -------------------------
DROP POLICY IF EXISTS "Users can insert redemptions" ON public.gift_redemptions;

CREATE OR REPLACE FUNCTION public.redeem_gift_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  gc RECORD;
  new_balance int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;
  _code := upper(regexp_replace(COALESCE(_code,''), '[^A-Za-z0-9]', '', 'g'));
  IF length(_code) < 6 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_code'); END IF;

  SELECT * INTO gc FROM public.gift_codes
   WHERE upper(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')) = _code
   FOR UPDATE;

  IF gc IS NULL OR gc.status <> 'active' OR gc.redeemed_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF gc.expires_at IS NOT NULL AND gc.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  IF COALESCE(gc.coin_amount, 0) <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  UPDATE public.gift_codes
     SET status = 'used', redeemed_by = uid, redeemed_at = now()
   WHERE id = gc.id AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'already_used'); END IF;

  INSERT INTO public.user_gems(user_id, balance, total_earned)
  VALUES (uid, gc.coin_amount, gc.coin_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_gems.balance + gc.coin_amount,
        total_earned = public.user_gems.total_earned + gc.coin_amount,
        updated_at = now()
  RETURNING balance INTO new_balance;

  INSERT INTO public.gift_redemptions(user_id, code, coin_amount)
  VALUES (uid, gc.code, gc.coin_amount);

  PERFORM public.log_finance_event(uid, 'gift_code_redeem', 'user_gems', gc.coin_amount, NULL, new_balance,
    jsonb_build_object('code_id', gc.id));

  RETURN jsonb_build_object('success', true, 'coin_amount', gc.coin_amount, 'balance', new_balance);
END; $$;
REVOKE ALL ON FUNCTION public.redeem_gift_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gift_code(text) TO authenticated;

-- 6) Broadcast donations: debit the donor server-side ----------------
DROP POLICY IF EXISTS "Public can view donations" ON public.broadcast_donations;
DROP POLICY IF EXISTS "Authenticated can view donations" ON public.broadcast_donations;
DROP POLICY IF EXISTS "Authenticated users can send donations" ON public.broadcast_donations;
REVOKE SELECT ON public.broadcast_donations FROM anon;

CREATE OR REPLACE FUNCTION public.send_broadcast_donation(
  _broadcast_id text, _creator_user_id uuid, _amount numeric, _message text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  bal numeric;
  new_balance numeric;
  amt numeric := floor(COALESCE(_amount, 0));
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;
  IF amt <= 0 OR amt > 1000000 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;
  IF _creator_user_id IS NULL OR _creator_user_id = uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_recipient');
  END IF;

  SELECT balance INTO bal FROM public.user_gems WHERE user_id = uid FOR UPDATE;
  IF bal IS NULL OR bal < amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_gems');
  END IF;

  UPDATE public.user_gems SET balance = balance - amt, updated_at = now()
   WHERE user_id = uid RETURNING balance INTO new_balance;

  INSERT INTO public.broadcast_donations(broadcast_id, donor_user_id, creator_user_id, amount, message)
  VALUES (_broadcast_id, uid, _creator_user_id, amt, NULLIF(trim(COALESCE(_message,'')), ''));

  PERFORM public.log_finance_event(uid, 'broadcast_donation', 'user_gems', -amt, bal, new_balance,
    jsonb_build_object('creator_user_id', _creator_user_id, 'broadcast_id', _broadcast_id));

  RETURN jsonb_build_object('success', true, 'balance', new_balance, 'amount', amt);
END; $$;
REVOKE ALL ON FUNCTION public.send_broadcast_donation(text,uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_broadcast_donation(text,uuid,numeric,text) TO authenticated;

-- 7) Post tips: debit the tipper server-side -------------------------
DROP POLICY IF EXISTS "Authenticated users can tip" ON public.post_tips;

CREATE OR REPLACE FUNCTION public.send_post_tip(
  _post_id uuid, _amount numeric, _message text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  creator uuid;
  bal numeric;
  new_balance numeric;
  amt numeric := floor(COALESCE(_amount, 0));
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;
  IF amt <= 0 OR amt > 1000000 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;

  SELECT user_id INTO creator FROM public.posts WHERE id = _post_id;
  IF creator IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'post_not_found'); END IF;
  IF creator = uid THEN RETURN jsonb_build_object('success', false, 'error', 'cannot_tip_self'); END IF;

  SELECT balance INTO bal FROM public.user_gems WHERE user_id = uid FOR UPDATE;
  IF bal IS NULL OR bal < amt THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_gems');
  END IF;

  UPDATE public.user_gems SET balance = balance - amt, updated_at = now()
   WHERE user_id = uid RETURNING balance INTO new_balance;

  INSERT INTO public.post_tips(post_id, tipper_id, creator_id, amount, message)
  VALUES (_post_id, uid, creator, amt, NULLIF(trim(COALESCE(_message,'')), ''));

  PERFORM public.log_finance_event(uid, 'post_tip', 'user_gems', -amt, bal, new_balance,
    jsonb_build_object('post_id', _post_id, 'creator_id', creator));

  RETURN jsonb_build_object('success', true, 'balance', new_balance, 'amount', amt);
END; $$;
REVOKE ALL ON FUNCTION public.send_post_tip(uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_post_tip(uuid,numeric,text) TO authenticated;

-- 8) Subscriptions: no self-granted plans or R Coins -----------------
DROP POLICY IF EXISTS "user_subs_update_own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "user_subs_insert_own" ON public.user_subscriptions;

CREATE POLICY "user_subs_insert_own_free" ON public.user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND plan = 'free'::subscription_plan
    AND plan_id = 'free'
    AND r_coins = 0
    AND activated_by IS NULL
    AND expires_at IS NULL
  );

DROP POLICY IF EXISTS "user_subs_admin_all" ON public.user_subscriptions;
CREATE POLICY "user_subs_admin_all" ON public.user_subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 9) Combo leaderboard is cosmetic: scope to authenticated -----------
DROP POLICY IF EXISTS "Users can insert their combos" ON public.combo_leaderboard;
CREATE POLICY "Users can insert their combos" ON public.combo_leaderboard
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their combos" ON public.combo_leaderboard;
CREATE POLICY "Users can update their combos" ON public.combo_leaderboard
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';