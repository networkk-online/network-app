DROP POLICY IF EXISTS "tb_viewer_open" ON public.live_treasure_box;

CREATE OR REPLACE FUNCTION public.claim_treasure_box(_box_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  b RECORD;
  reward int;
  new_balance int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'unauthorized'); END IF;

  SELECT * INTO b FROM public.live_treasure_box WHERE id = _box_id FOR UPDATE;
  IF b IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF b.opened_by IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'already_claimed'); END IF;
  IF b.expires_at IS NOT NULL AND b.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  reward := LEAST(GREATEST(COALESCE(b.reward_coins, 0), 0), 10000);

  UPDATE public.live_treasure_box
     SET opened_by = uid, opened_at = now()
   WHERE id = b.id AND opened_by IS NULL;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'already_claimed'); END IF;

  INSERT INTO public.user_gems(user_id, balance, total_earned)
  VALUES (uid, reward, reward)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.user_gems.balance + reward,
        total_earned = public.user_gems.total_earned + reward,
        updated_at = now()
  RETURNING balance INTO new_balance;

  PERFORM public.log_finance_event(uid, 'treasure_box_claim', 'user_gems', reward, NULL, new_balance,
    jsonb_build_object('box_id', b.id, 'stream_id', b.stream_id, 'tier', b.tier));

  RETURN jsonb_build_object('success', true, 'reward', reward, 'balance', new_balance);
END; $$;
REVOKE ALL ON FUNCTION public.claim_treasure_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_treasure_box(uuid) TO authenticated;

-- cap host-dropped rewards server-side
CREATE OR REPLACE FUNCTION public.guard_treasure_box_reward()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.reward_coins := LEAST(GREATEST(COALESCE(NEW.reward_coins, 0), 0), 10000);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_tb_reward_cap ON public.live_treasure_box;
CREATE TRIGGER trg_tb_reward_cap BEFORE INSERT OR UPDATE ON public.live_treasure_box
  FOR EACH ROW EXECUTE FUNCTION public.guard_treasure_box_reward();

NOTIFY pgrst, 'reload schema';